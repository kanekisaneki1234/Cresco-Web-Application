import axios from 'axios';

const DocumentDataHandler = {
    handleDocumentSubmit: async (file, setDocumentData, setError, setLoading) => {
        // e.preventDefault();
        // setLoading(true);
        setError(null);

        if (!file) {
          alert("Please select a file first!");
          return;
        }

        setLoading(true);

        const formdata = new FormData();
        formdata.append("file", file);

        try {
            const response = await axios.post("http://localhost:5058/api/Main/ExtractTables", formdata, {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            });
      
            if (response.data.Status === "error") {
              setError(response.data.Error);
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
                setDocumentData(parsedData);
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
                    message: "Failed to upload file",
                    details: err.message
                }
            );
        } finally {
            setLoading(false);
        }
    },
}

export default DocumentDataHandler;