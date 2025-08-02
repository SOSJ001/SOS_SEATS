// server.js
import { json } from "@sveltejs/kit";

export async function POST({ request }) {
  const { baseImageSrc } = await request.json();
  try {
    const response = await fetch(baseImageSrc);

    const buffer = await response.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString("base64");
    const dataURL = `data:${response.headers.get(
      "content-type"
    )};base64,${base64Image}`;
    return json({ dataURL }, { status: 201 });
  } catch (error) {
    return json({ error: error.message }, { status: 500 });
  }
}
