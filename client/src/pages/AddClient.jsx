import { useState } from "react";
import { useNavigate } from "react-router-dom";

const AddClient = () => {
  const [adAccountId, setAdAccountId] = useState("");
  const [adAccountName, setAdAccountName] = useState("");
  const [category, setCategory] = useState("ECOMMERCE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showFinalConsent, setShowFinalConsent] = useState(false);
  const navigate = useNavigate();

  // Show final confirmation modal on submit
  const handleSubmit = (e) => {
    e.preventDefault();
    setShowFinalConsent(true);
  };

  // Final confirmation — send to backend
  const handleFinalConsent = async () => {
    setLoading(true);
    setError("");
    setShowFinalConsent(false);

    try {
      const res = await fetch("/api/clients/add-new-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adAccountId,
          adAccountName,
          category,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to add client.");
      } else {
        alert(`✅ ${data.message}`);
        navigate("/client-level");
      }
    } catch (err) {
      console.error("Network error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f1116] px-4">
      {/* Final Confirmation Modal */}
      {showFinalConsent && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-[#1a1d24] p-8 rounded-xl shadow-lg w-full max-w-sm">
            <h3 className="text-xl font-bold mb-4 text-white text-center">
              Confirm Client Details
            </h3>

            <div className="bg-[#111318] p-4 rounded-lg mb-6 text-gray-300 text-sm">
              <p>
                <span className="text-gray-400 font-medium">Ad Account ID:</span>{" "}
                <span className="text-white">{adAccountId || "—"}</span>
              </p>
              <p>
                <span className="text-gray-400 font-medium">Ad Account Name:</span>{" "}
                <span className="text-white">{adAccountName || "—"}</span>
              </p>
              <p>
                <span className="text-gray-400 font-medium">Category:</span>{" "}
                <span className="text-white">
                  {category === "ECOMMERCE" ? "E-commerce" : "Leads"}
                </span>
              </p>
            </div>

            <p className="text-gray-300 mb-6 text-center text-sm">
              Please confirm that the details above are correct before adding the client.
            </p>

            <div className="flex justify-center gap-4">
              <button
                className="bg-gray-500 text-white px-4 py-2 rounded"
                onClick={() => setShowFinalConsent(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                onClick={handleFinalConsent}
                disabled={loading}
              >
                {loading ? "Adding..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Form */}
      <div className="bg-[#1a1d24] rounded-xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-white text-center">Add New Client</h2>
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Ad Account ID
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 rounded bg-[#222] text-white border border-[#333] focus:outline-none"
              value={adAccountId}
              onChange={(e) => setAdAccountId(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Ad Account Name
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 rounded bg-[#222] text-white border border-[#333] focus:outline-none"
              value={adAccountName}
              onChange={(e) => setAdAccountName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Category
            </label>
            <select
              className="w-full px-3 py-2 rounded bg-[#222] text-white border border-[#333] focus:outline-none"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="ECOMMERCE">E-commerce</option>
              <option value="LEADS">Leads</option>
            </select>
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center">{error}</div>
          )}

          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded transition"
            disabled={loading}
          >
            Add Client
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddClient;
