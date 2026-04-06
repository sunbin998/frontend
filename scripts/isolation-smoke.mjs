import axios from "axios";

const API_BASE_URL = process.env.AUTH_SMOKE_BASE_URL || "http://127.0.0.1:8080/api";

function step(name) {
    process.stdout.write(`\n[STEP] ${name}\n`);
}

function fail(message, error) {
    console.error(`\n[FAIL] ${message}`);
    if (error?.response) {
        console.error("status:", error.response.status);
        console.error("data:", error.response.data);
    } else if (error) {
        console.error(error.message || error);
    }
    process.exit(1);
}

function assert(condition, message) {
    if (!condition) {
        fail(message);
    }
}

async function register(client, username, password, email) {
    const res = await client.post("/auth/register", { username, password, email });
    const accessToken = res.data?.access_token;
    assert(Boolean(accessToken), `register token missing for ${username}`);
    return accessToken;
}

function authHeaders(token) {
    return { Authorization: `Bearer ${token}` };
}

async function main() {
    const id = Date.now();
    const password = "SmokePass123!";
    const userA = {
        username: `iso_user_a_${id}`,
        email: `iso_user_a_${id}@example.com`,
    };
    const userB = {
        username: `iso_user_b_${id}`,
        email: `iso_user_b_${id}@example.com`,
    };

    const client = axios.create({
        baseURL: API_BASE_URL,
        timeout: 15000,
        headers: { "Content-Type": "application/json" },
    });

    step("register user A and user B");
    let tokenA;
    let tokenB;
    try {
        tokenA = await register(client, userA.username, password, userA.email);
        tokenB = await register(client, userB.username, password, userB.email);
        console.log("[OK] both users registered");
    } catch (error) {
        fail("register users failed", error);
    }

    step("user A creates session");
    let sessionId;
    const sessionTitle = `isolation_session_${id}`;
    try {
        const sessionRes = await client.post(
            "/sessions/",
            { title: sessionTitle },
            { headers: authHeaders(tokenA) }
        );
        sessionId = sessionRes.data?.id;
        assert(Boolean(sessionId), "session id missing");
        console.log(`[OK] user A created session: ${sessionId}`);
    } catch (error) {
        fail("user A create session failed", error);
    }

    step("user B cannot see user A session in list");
    try {
        const listB = await client.get("/sessions/", { headers: authHeaders(tokenB) });
        const hasA = (listB.data || []).some((s) => s.id === sessionId || s.title === sessionTitle);
        assert(!hasA, "user B can see user A session unexpectedly");
        console.log("[OK] user B session list is isolated");
    } catch (error) {
        fail("user B session list check failed", error);
    }

    step("user B cannot delete user A session");
    try {
        await client.delete(`/sessions/${sessionId}`, { headers: authHeaders(tokenB) });
        fail("user B deleted user A session unexpectedly");
    } catch (error) {
        const status = error?.response?.status;
        if (status !== 404) {
            fail(`expected 404 when user B deletes user A session, got ${status || "unknown"}`, error);
        }
        console.log("[OK] user B deletion blocked with 404");
    }

    step("user A session still exists");
    try {
        const listA = await client.get("/sessions/", { headers: authHeaders(tokenA) });
        const hasA = (listA.data || []).some((s) => s.id === sessionId);
        assert(hasA, "user A session missing after user B delete attempt");
        console.log("[OK] user A session remains intact");
    } catch (error) {
        fail("user A session verification failed", error);
    }

    step("user A creates category; user B should not see it");
    const categoryName = `isolation_category_${id}`;
    let categoryId;
    try {
        const createCat = await client.post(
            "/categories/",
            { name: categoryName, color_code: "#6366f1" },
            { headers: authHeaders(tokenA) }
        );
        categoryId = createCat.data?.id;
        assert(Boolean(categoryId), "category id missing");

        const listCatB = await client.get("/categories/", { headers: authHeaders(tokenB) });
        const hasCat = (listCatB.data || []).some((c) => c.id === categoryId || c.name === categoryName);
        assert(!hasCat, "user B can see user A category unexpectedly");
        console.log("[OK] category isolation works");
    } catch (error) {
        fail("category isolation check failed", error);
    }

    console.log("\n[SUCCESS] user isolation smoke test passed");
}

main().catch((error) => fail("unexpected error", error));
