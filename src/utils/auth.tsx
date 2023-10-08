import client from "~/utils/client";

export async function fetchUser() {
	const { data: user } = await client.get("/api/user");
	return user;
}
