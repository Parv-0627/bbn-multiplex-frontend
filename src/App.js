import React, { useState } from "react";

function App() {
  const [video, setVideo] = useState(null);
  const [headline, setHeadline] = useState("");

  const handleUpload = async () => {
    if (!video) {
      alert("Please upload a video");
      return;
    }

    const formData = new FormData();
    formData.append("video", video);
    formData.append("headline", headline);

    const response = await fetch(
      "https://unstayable-nondeprecatorily-flavia.ngrok-free.dev/convert",
      {
        method: "POST",
        body: formData,
      }
    );

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "edited-video.mp4";
    a.click();
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>BBN Multiplex 🎬</h1>

      <input
        type="file"
        accept="video/*"
        onChange={(e) => setVideo(e.target.files[0])}
      />

      <br /><br />

      <input
        type="text"
        placeholder="Enter Headline"
        value={headline}
        onChange={(e) => setHeadline(e.target.value)}
        style={{ width: "300px", padding: "8px" }}
      />

      <br /><br />

      <button onClick={handleUpload} style={{ padding: "10px 20px" }}>
        Convert & Download
      </button>
    </div>
  );
}

export default App;
