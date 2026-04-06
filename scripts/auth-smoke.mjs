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

async function main() {
    const id = Date.now();
    const username = `smoke_user_${id}`;
    const password = "SmokePass123!";
    const email = `${username}@example.com`;

    const client = axios.create({
        baseURL: API_BASE_URL,
        timeout: 15000,
        headers: { "Content-Type": "application/json" },
    });

    step("register");
    let accessToken;
    let refreshToken;
    try {
        const registerRes = await client.post("/auth/register", {
            username,
            password,
            email,
        });

        accessToken = registerRes.data?.access_token;
        refreshToken = registerRes.data?.refresh_token;
        if (!accessToken || !refreshToken) {
            fail("register succeeded but token payload is missing");
        }
        console.log(`[OK] registered user: ${username}`);
    } catch (error) {
        fail("register failed", error);
    }

    step("me with access token");
    try {
        const meRes = await client.get("/auth/me", {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (meRes.data?.username !== username) {
            fail(`expected username ${username}, got ${meRes.data?.username}`);
        }
        console.log("[OK] /auth/me returned expected user");
    } catch (error) {
        fail("/auth/me failed", error);
    }

    step("refresh token");
    try {
        const refreshRes = await client.post("/auth/refresh", {
            refresh_token: refreshToken,
        });

        accessToken = refreshRes.data?.access_token;
        refreshToken = refreshRes.data?.refresh_token;

        if (!accessToken || !refreshToken) {
            fail("refresh succeeded but token payload is missing");
        }
        console.log("[OK] refresh token succeeded");
    } catch (error) {
        fail("refresh token failed", error);
    }

    step("me with refreshed access token");
    try {
        const meRes = await client.get("/auth/me", {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (meRes.data?.username !== username) {
            fail(`expected username ${username}, got ${meRes.data?.username}`);
        }
        console.log("[OK] /auth/me works with refreshed token");
    } catch (error) {
        fail("/auth/me with refreshed token failed", error);
    }

    step("negative test: invalid token should be rejected");
    try {
        await client.get("/auth/me", {
            headers: { Authorization: "Bearer invalid.token.value" },
        });
        fail("invalid token was unexpectedly accepted");
    } catch (error) {
        const status = error?.response?.status;
        if (status !== 401) {
            fail(`expected 401 for invalid token, got ${status || "unknown"}`, error);
        }
        console.log("[OK] invalid token rejected with 401");
    }

    console.log("\n[SUCCESS] auth smoke test passed");
}

main().catch((error) => fail("unexpected error", error));
