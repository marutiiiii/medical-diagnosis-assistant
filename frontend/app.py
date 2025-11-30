import streamlit as st
import requests

# URL of your FastAPI backend
API_BASE = "http://127.0.0.1:8000"


def upload_report_tab():
    st.header("1️⃣ Upload Medical Report")

    uploaded_file = st.file_uploader(
        "Upload a medical report (PDF or TXT)", type=["pdf", "txt"]
    )

    if uploaded_file is not None:
        st.write(f"Selected file: **{uploaded_file.name}**")

    if st.button("Upload & process") and uploaded_file is not None:
        files = {
            "file": (
                uploaded_file.name,
                uploaded_file.getvalue(),
                uploaded_file.type,
            )
        }

        with st.spinner("Uploading and creating embeddings..."):
            try:
                resp = requests.post(f"{API_BASE}/reports/upload", files=files)
            except Exception as e:
                st.error(f"Backend connection error: {e}")
                return

        if resp.status_code == 200:
            data = resp.json()
            st.success("Report uploaded successfully ✅")

            st.write("**Document ID:**")
            st.code(data["document_id"])

            st.write("**Number of chunks:**", data["chunks"])

            # Save document_id to session so next tab can use it automatically
            st.session_state["document_id"] = data["document_id"]
        else:
            st.error(f"Error from backend: {resp.status_code}")
            try:
                st.json(resp.json())
            except Exception:
                pass


def ask_question_tab():
    st.header("2️⃣ Ask AI about your report")

    default_doc_id = st.session_state.get("document_id", "")
    document_id = st.text_input("Document ID", value=default_doc_id)

    question = st.text_area(
        "Your question",
        placeholder="Example: Explain the key findings in simple language.",
    )

    if st.button("Get AI explanation"):
        if not document_id.strip():
            st.warning("Please enter a Document ID (upload a report first).")
            return
        if not question.strip():
            st.warning("Please type a question.")
            return

        payload = {"document_id": document_id, "question": question}

        with st.spinner("Thinking..."):
            try:
                resp = requests.post(f"{API_BASE}/diagnosis/from_report", json=payload)
            except Exception as e:
                st.error(f"Backend connection error: {e}")
                return

        if resp.status_code == 200:
            data = resp.json()
            st.subheader("AI Answer")
            st.write(data["answer"])

            st.caption(
                f"Stored for user: {data['username']} at {data['created_at']}"
            )
        else:
            st.error(f"Error from backend: {resp.status_code}")
            try:
                st.json(resp.json())
            except Exception:
                pass


def main():
    st.set_page_config(page_title="Medical Diagnosis Assistant", page_icon="🩺")

    st.title("🩺 Medical Report AI Assistant")
    st.write("Upload a report, then ask questions about it.")

    tab1, tab2 = st.tabs(["Upload Report", "Ask Question"])

    with tab1:
        upload_report_tab()

    with tab2:
        ask_question_tab()


if __name__ == "__main__":
    main()
