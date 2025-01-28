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
    const store = getStore("marketing-tasks");

    if (req.method === "GET") {
      const result = await store.list();
      const boards = await Promise.all(
        result.blobs.map(async (blob) => {
          const data = await store.get(blob.key, { type: "json" });
          return { id: blob.key, ...data };
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
      await store.setJSON(boardId, body);
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
      await store.delete(id);
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