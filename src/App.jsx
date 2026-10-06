import React, { useState } from "react";

const API_URL = "http://127.0.0.1:8000/api/v1/analyze";

export default function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [hoveredRegion, setHoveredRegion] = useState(null);

  // =========================================================
  // FILE SELECTION
  // =========================================================

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));

    setResult(null);
    setError("");
    setHoveredRegion(null);
  };

  // =========================================================
  // ANALYZE IMAGE
  // =========================================================

  const analyzeImage = async () => {
    if (!selectedImage) {
      setError("Please select an image first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setHoveredRegion(null);

    try {
      const formData = new FormData();

      formData.append("file", selectedImage);

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(
          "Analysis failed. Please make sure the Flask backend is running."
        );
      }

      const data = await response.json();

      setResult(data);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to analyze the image. Please check the backend."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // RESET
  // =========================================================

  const resetAnalysis = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setResult(null);
    setError("");
    setHoveredRegion(null);

    const input = document.getElementById("image-upload");

    if (input) {
      input.value = "";
    }
  };

  // =========================================================
  // SCROLL TO ANALYSIS
  // =========================================================

  const scrollToAnalysis = () => {
    document
      .getElementById("analysis")
      ?.scrollIntoView({
        behavior: "smooth",
      });
  };

  // =========================================================
  // GET RESOLUTION
  // Supports both:
  // [1200, 800]
  // and
  // { width: 1200, height: 800 }
  // =========================================================

  const getResolution = () => {
    if (!result?.resolution) {
      return {
        width: 1,
        height: 1,
      };
    }

    if (Array.isArray(result.resolution)) {
      return {
        width: result.resolution[0],
        height: result.resolution[1],
      };
    }

    return {
      width: result.resolution.width || 1,
      height: result.resolution.height || 1,
    };
  };

  // =========================================================
  // REGION POSITION
  // =========================================================

  const getRegionStyle = (region) => {
    if (!region?.bbox) {
      return {};
    }

    const [x, y, width, height] = region.bbox;

    const resolution = getResolution();

    return {
      left: `${(x / resolution.width) * 100}%`,
      top: `${(y / resolution.height) * 100}%`,
      width: `${(width / resolution.width) * 100}%`,
      height: `${(height / resolution.height) * 100}%`,
    };
  };

  // =========================================================
  // RESPONSE COLOR
  // =========================================================

  const getResponseClass = (response) => {
    if (response === "High") {
      return "response-high";
    }

    if (response === "Medium") {
      return "response-medium";
    }

    return "response-low";
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="app">

      {/* =====================================================
          NAVBAR
      ====================================================== */}

      <nav className="navbar">

        <div className="container nav-inner">

          <a
            href="#home"
            className="logo"
          >
            <span className="logo-mark">
              CV
            </span>

            <span>
              Crack<span className="logo-accent">Vision</span>
            </span>
          </a>

          <div className="nav-links">

            <a href="#home">
              Home
            </a>

            <a href="#analysis">
              Analysis
            </a>

            <a href="#about">
              About
            </a>

          </div>

        </div>

      </nav>


      {/* =====================================================
          HERO
      ====================================================== */}

      <section
        id="home"
        className="hero-section"
      >

        <div className="container">

          <div className="hero-content">

            <div className="hero-badge">
              SURFACE INFRASTRUCTURE ANALYTICS
            </div>

            <h1>
              AI-Powered
              <br />
              <span>Crack Detection</span>
            </h1>

            <p>
              Upload an infrastructure image and analyze surface
              cracks using intelligent Digital Image Processing
              techniques.
            </p>

            <button
              className="primary-btn"
              onClick={scrollToAnalysis}
            >
              Start Analysis
              <span>→</span>
            </button>

          </div>

        </div>

      </section>


      {/* =====================================================
          ANALYSIS
      ====================================================== */}

      <section
        id="analysis"
        className="analysis-section"
      >

        <div className="container">

          <h2>
            Surface Analysis
          </h2>


          {/* =================================================
              UPLOAD CARD
          ================================================== */}

          <div className="upload-card">

            <h3>
              Upload an Image
            </h3>

            <p>
              Select a bridge, road, wall or concrete surface
              image for crack detection.
            </p>

            <div className="upload-controls">

              <label
                htmlFor="image-upload"
                className="primary-btn"
              >
                Choose Image
              </label>

              <input
                id="image-upload"
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleFileChange}
                hidden
              />

              <span className="file-name">
                {selectedImage
                  ? selectedImage.name
                  : "No file chosen"}
              </span>

            </div>


            {/* =================================================
                IMAGE PREVIEW
            ================================================== */}

            {previewUrl && (

              <div className="image-preview">

                <div className="preview-header">

                  <span>
                    Selected Image
                  </span>

                  <button
                    className="secondary-btn"
                    onClick={resetAnalysis}
                  >
                    Remove
                  </button>

                </div>

                <img
                  src={previewUrl}
                  alt="Selected infrastructure"
                />

              </div>

            )}


            {/* =================================================
                ANALYZE BUTTON
            ================================================== */}

            <div className="upload-actions">

              <button
                className="primary-btn"
                onClick={analyzeImage}
                disabled={!selectedImage || loading}
              >

                {loading ? (
                  <>
                    <span className="button-spinner"></span>
                    Analyzing...
                  </>
                ) : (
                  <>
                    Analyze Image
                    <span>→</span>
                  </>
                )}

              </button>

              {result && (

                <button
                  className="secondary-btn"
                  onClick={resetAnalysis}
                >
                  Analyze Another Image
                </button>

              )}

            </div>

          </div>


          {/* =================================================
              ERROR
          ================================================== */}

          {error && (

            <div className="error-message">

              <strong>
                Analysis Error
              </strong>

              <p>
                {error}
              </p>

            </div>

          )}


          {/* =================================================
              LOADING
          ================================================== */}

          {loading && (

            <div className="loading-state">

              <div className="spinner"></div>

              <h3>
                Analyzing Surface
              </h3>

              <p>
                Processing the image using Digital Image
                Processing techniques...
              </p>

            </div>

          )}


          {/* =================================================
              RESULTS
          ================================================== */}

          {result && !loading && (

            <div className="results-card">

              <h3>
                Detection Results
              </h3>


              {/* =================================================
                  STATUS
              ================================================== */}

              <div className="detection-status">

                <div className="status-icon">
                  ✓
                </div>

                <div>

                  <strong>
                    Detection Complete
                  </strong>

                  <p>
                    Surface analysis completed successfully.
                  </p>

                </div>

              </div>


              {/* =================================================
                  METRICS
              ================================================== */}

              <div className="results-grid">


                {/* REGION COUNT */}

                <div className="result-box">

                  <span>
                    DETECTED REGIONS
                  </span>

                  <strong>
                    {result.region_count ?? 0}
                  </strong>

                </div>


                {/* COVERAGE */}

                <div className="result-box">

                  <span>
                    SURFACE COVERAGE
                  </span>

                  <strong>
                    {Number(
                      result.coverage_percent ?? 0
                    ).toFixed(2)}
                    %
                  </strong>

                </div>


                {/* RESOLUTION */}

                <div className="result-box">

                  <span>
                    IMAGE RESOLUTION
                  </span>

                  <strong>

                    {getResolution().width}

                    {" × "}

                    {getResolution().height}

                  </strong>

                </div>


                {/* PROCESSING TIME */}

                <div className="result-box">

                  <span>
                    PROCESSING TIME
                  </span>

                  <strong>
                    {Number(
                      result.processing_time ?? 0
                    ).toFixed(2)}
                    s
                  </strong>

                </div>

              </div>


              {/* =================================================
                  IMAGE RESULTS
              ================================================== */}

              <div className="image-results">


                {/* =================================================
                    ORIGINAL
                ================================================== */}

                <div className="result-image">

                  <h4>
                    ORIGINAL IMAGE
                  </h4>

                  <img
                    src={previewUrl}
                    alt="Original infrastructure"
                  />

                </div>


                {/* =================================================
                    CRACK OVERLAY
                ================================================== */}

                <div className="result-image">

                  <h4>
                    CRACK DETECTION OVERLAY
                  </h4>

                  <div className="crack-overlay">

                    {/* Original */}

                    <img
                      src={previewUrl}
                      alt="Crack overlay"
                    />


                    {/* Mask */}

                    {result.mask && (

                      <img
                        src={result.mask}
                        alt="Detected crack mask"
                        className="overlay-mask"
                      />

                    )}


                    {/* =================================================
                        REGION BOXES
                    ================================================== */}

                    {Array.isArray(result.regions) &&
                      result.regions.map((region) => (

                        <div
                          key={region.id}
                          className={`region-hotspot ${
                            hoveredRegion?.id === region.id
                              ? "active"
                              : ""
                          }`}
                          style={getRegionStyle(region)}
                          onMouseEnter={() =>
                            setHoveredRegion(region)
                          }
                          onMouseLeave={() =>
                            setHoveredRegion(null)
                          }
                          onClick={() =>
                            setHoveredRegion(region)
                          }
                        >

                          <div className="region-tooltip">

                            <strong>
                              Region #{region.id}
                            </strong>

                            <span>
                              Area: {region.area}px²
                            </span>

                            <span>
                              Response: {region.response}
                            </span>

                            <span>
                              Bounding Box:
                              <br />
                              [{region.bbox?.join(", ")}]
                            </span>

                          </div>

                        </div>

                      ))}

                  </div>

                  <p className="hover-instruction">
                    Hover or click a detected region to inspect details.
                  </p>

                </div>


                {/* =================================================
                    MASK
                ================================================== */}

                <div className="result-image">

                  <h4>
                    DETECTED CRACK MASK
                  </h4>

                  {result.mask ? (

                    <img
                      src={result.mask}
                      alt="Detected crack mask"
                    />

                  ) : (

                    <div className="no-mask">
                      No mask available
                    </div>

                  )}

                </div>

              </div>


              {/* =================================================
                  REGIONS TITLE
              ================================================== */}

              <h3 className="regions-title">
                Detected Crack Regions
              </h3>


              {/* =================================================
                  REGION TABLE
              ================================================== */}

              {Array.isArray(result.regions) &&
              result.regions.length > 0 ? (

                <div className="region-table-wrapper">

                  <table className="region-table">

                    <thead>

                      <tr>

                        <th>
                          Region ID
                        </th>

                        <th>
                          Area
                        </th>

                        <th>
                          Bounding Box
                        </th>

                        <th>
                          Detection Response
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {result.regions.map((region) => (

                        <tr
                          key={region.id}
                          className={
                            hoveredRegion?.id === region.id
                              ? "active-region"
                              : ""
                          }
                          onMouseEnter={() =>
                            setHoveredRegion(region)
                          }
                          onMouseLeave={() =>
                            setHoveredRegion(null)
                          }
                          onClick={() =>
                            setHoveredRegion(region)
                          }
                        >

                          <td>
                            #{region.id}
                          </td>

                          <td>
                            {region.area} px
                          </td>

                          <td>
                            [{region.bbox?.join(", ")}]
                          </td>

                          <td>

                            <span
                              className={`response-badge ${getResponseClass(
                                region.response
                              )}`}
                            >
                              {region.response}
                            </span>

                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              ) : (

                <div className="no-regions">
                  No crack regions detected.
                </div>

              )}

            </div>

          )}

        </div>

      </section>


      {/* =====================================================
          ABOUT
      ====================================================== */}

      <section
        id="about"
        className="about-section"
      >

        <div className="container">

          <h2>
            About CrackVision
          </h2>

          <p>

            CrackVision is a Digital Image Processing based
            infrastructure inspection system designed to identify
            and analyze surface cracks in bridges, roads, walls
            and concrete structures.

          </p>

          <p>

            The system uses classical image processing techniques
            including grayscale conversion, Gaussian filtering,
            CLAHE enhancement, black-hat transformation,
            percentile thresholding and connected-component
            analysis.

          </p>

        </div>

      </section>


      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer className="footer">

        <div className="container">

          <div className="footer-inner">

            <div className="footer-brand">

              Crack<span>Vision</span>

            </div>

            <p>
              Surface Infrastructure Crack Detection
            </p>

            <p>
              Digital Image Processing Project
            </p>

          </div>

        </div>

      </footer>

    </div>
  );
}