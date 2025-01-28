import { getStore } from "@netlify/blobs";

export default async function handler(req) {
  try {
    const store = getStore("marketing-tasks");

    if (req.method === "GET") {
      const result = await store.list();
      const keys = result.blobs.map((blob) => blob.key);
      const boards = await Promise.all(
        keys.map(async (key) => {
          const data = await store.get(key, { type: "json" });
          return { id: key, ...data };
        })
      );
      return new Response(JSON.stringify(boards), { status: 200 });
    }

    if (req.method === "PUT") {
      const body = await req.json();
      const boardId = body.id || `board-${Date.now()}`;
      await store.setJSON(boardId, body);
      return new Response(JSON.stringify({ message: "Board saved", id: boardId }), { status: 200 });
    }

    if (req.method === "DELETE") {
      const url = new URL(req.url);
      const id = url.searchParams.get("id");
      if (!id) {
        return new Response(JSON.stringify({ error: "No id provided" }), { status: 400 });
      }
      await store.delete(id);
      return new Response(JSON.stringify({ message: "Board deleted" }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}