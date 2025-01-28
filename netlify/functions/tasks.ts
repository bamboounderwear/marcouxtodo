import { getStore } from "@netlify/blobs";
import { Context } from "@netlify/functions";

export default async function handler(req, context: Context) {
  // Check if user is authenticated
  if (!context.identity?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const userId = context.identity.user.id;
    const store = getStore("marketing-tasks");

    if (req.method === "GET") {
      const result = await store.list({ prefix: `${userId}/` });
      const keys = result.blobs.map((blob) => blob.key);
      const boards = await Promise.all(
        keys.map(async (key) => {
          const data = await store.get(key, { type: "json" });
          return { id: key.replace(`${userId}/`, ''), ...data };
        })
      );
      return new Response(JSON.stringify(boards), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (req.method === "PUT") {
      const body = await req.json();
      const boardId = body.id || `board-${Date.now()}`;
      const key = `${userId}/${boardId}`;
      await store.setJSON(key, body);
      return new Response(JSON.stringify({ message: "Board saved", id: boardId }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (req.method === "DELETE") {
      const url = new URL(req.url);
      const id = url.searchParams.get("id");
      if (!id) {
        return new Response(JSON.stringify({ error: "No id provided" }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      await store.delete(`${userId}/${id}`);
      return new Response(JSON.stringify({ message: "Board deleted" }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}