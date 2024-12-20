// server.js
import { json } from "@sveltejs/kit";

export async function POST({ request }) {
  const { baseImageSrc } = await request.json();
  // console.log(baseImageSrc)
  try {
    const response = await fetch(baseImageSrc);
    
    const buffer = await response.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString("base64");
    const dataURL = `data:${response.headers.get(
      "content-type"
    )};base64,${base64Image}`;
    // console.log(dataURL)
      return json({ dataURL }, { status: 201 });
  } catch (error) {
    console.error("Error fetching image:", error);
     return json({ }, { status: 201 });
  }
}
