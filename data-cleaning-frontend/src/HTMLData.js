import axios from "axios";

const HTMLDataHandler = {
    fetchHTMLData: async (e, url, setLoading, setError, setHTMLData) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formdata = new FormData();
        formdata.append("url", url);

        try {
            const response = await axios.post("http://localhost:5058/api/Main/htmlData", formdata, {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            });
      
            if (response.data.Status === "error") {
              setError(response.data.error);
              setLoading(false);
              return;
            }
      
            if (!response.data.data) {
              setError({
                type: "RESPONSE_ERROR",
                message: "Invalid response format",
                details: "Response data is missing"
              });
              setLoading(false);
              return;
            }

            try {
                const parsedData = JSON.parse(response.data.data);
                setHTMLData(parsedData);
            } catch (parseError) {
                setError({
                  type: "PARSE_ERROR",
                  message: "Failed to parse response data",
                  details: parseError.message,
                });
            }
      
        } catch (err) {
            setError(
                err.response?.data?.error || {
                    type: "NETWORK_ERROR",
                    message: "Failed to upload url. No response from API or no url provided",
                    details: err.message
                }
            );
        } finally {
            setLoading(false);
        }
    },
}

export default HTMLDataHandler;