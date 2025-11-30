import streamlit as st
import requests

API_URL = "http://127.0.0.1:8000"


# ---------- AUTH HELPERS ----------

def signup(username: str, password: str, role: str = "patient"):
    payload = {"username": username, "password": password, "role": role}
    return requests.post(f"{API_URL}/auth/signup", json=payload)


def login(username: str, password: str):
    payload = {"username": username, "password": password}
    return requests.post(f"{API_URL}/auth/login", json=payload)


# ---------- UI SECTIONS ----------

def auth_section():
    st.sidebar.title("🔐 Authentication")

    if "user" not in st.session_state:
        st.session_state["user"] = None
    if "token" not in st.session_state:
        st.session_state["token"] = None

    choice = st.sidebar.radio("Choose", ["Login", "Signup"])

    if choice == "Signup":
        st.sidebar.subheader("Create Account")
        su_name = st.sidebar.text_input("New username")
        su_pass = st.sidebar.text_input("New password", type="password")

        if st.sidebar.button("Sign up"):
            if not su_name or not su_pass:
                st.sidebar.warning("Enter username & password")
            else:
                res = signup(su_name, su_pass, role="patient")
                if res.status_code == 200:
                    st.sidebar.success("Signup successful! You can login now.")
                else:
                    st.sidebar.error(f"Signup failed: {res.json().get('detail', res.text)}")

    st.sidebar.subheader("Login")
    li_name = st.sidebar.text_input("Username", key="login_user")
    li_pass = st.sidebar.text_input("Password", type="password", key="login_pass")

    if st.sidebar.button("Login"):
        if not li_name or not li_pass:
            st.sidebar.warning("Enter username & password")
        else:
            res = login(li_name, li_pass)
            if res.status_code == 200:
                data = res.json()
                st.session_state["user"] = li_name
                st.session_state["token"] = data["token"]  # not used yet, but stored
                st.sidebar.success(f"Logged in as {li_name}")
            else:
                st.sidebar.error(f"Login failed: {res.json().get('detail', res.text)}")

    # Logout button
    if st.session_state["user"]:
        if st.sidebar.button("Logout"):
            st.session_state["user"] = None
            st.session_state["token"] = None
            st.sidebar.info("Logged out.")


def upload_report_tab():
    st.header("1️⃣ Upload Medical Report")

    if "user" not in st.session_state or st.session_state["user"] is None:
        st.warning("Please login first (use sidebar).")
        return

    uploaded_file = st.file_uploader("Upload PDF/TXT report", type=["pdf", "txt"])

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
                res = requests.post(f"{API_URL}/reports/upload", files=files)
            except Exception as e:
                st.error(f"Backend connection error: {e}")
                return

        if res.status_code == 200:
            data = res.json()
            st.success("Report uploaded successfully ✅")
            st.write("**Document ID:**")
            st.code(data["document_id"])
            st.write("**Chunks stored:**", data["chunks"])

            # store document_id for current session
            st.session_state["document_id"] = data["document_id"]
        else:
            st.error(f"Error from backend: {res.status_code}")
            try:
                st.json(res.json())
            except Exception:
                pass


def ask_question_tab():
    st.header("2️⃣ Ask AI about your report")

    if "user" not in st.session_state or st.session_state["user"] is None:
        st.warning("Please login first.")
        return

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

        payload = {
            "document_id": document_id,
            "question": question,
            "username": st.session_state["user"],  # 👈 send logged-in username
        }

        with st.spinner("Thinking..."):
            try:
                res = requests.post(f"{API_URL}/diagnosis/from_report", json=payload)
            except Exception as e:
                st.error(f"Backend connection error: {e}")
                return

        if res.status_code == 200:
            data = res.json()
            st.subheader("AI Answer")
            st.write(data["answer"])
            st.caption(
                f"Stored for user: {data['username']} at {data['created_at']}"
            )
        else:
            st.error(f"Error from backend: {res.status_code}")
            try:
                st.json(res.json())
            except Exception:
                pass


def history_tab():
    st.header("3️⃣ Your Diagnosis History")

    if "user" not in st.session_state or st.session_state["user"] is None:
        st.warning("Please login first.")
        return

    username = st.session_state["user"]
    st.write(f"Showing history for: **{username}**")

    payload = {"patient_username": username}

    with st.spinner("Fetching history..."):
        try:
            res = requests.post(f"{API_URL}/diagnosis/by_patient_name", json=payload)
        except Exception as e:
            st.error(f"Backend connection error: {e}")
            return

    if res.status_code == 200:
        data = res.json()
        records = data.get("records", [])
        if not records:
            st.info("No previous diagnoses found.")
            return

        for rec in records:
            st.markdown("---")
            st.markdown(f"**Q:** {rec['question']}")
            st.markdown(f"**A:** {rec['answer']}")
            st.caption(
                f"Doc ID: {rec['document_id']} • Time: {rec['created_at']}"
            )
    else:
        st.error(f"Error from backend: {res.status_code}")
        try:
            st.json(res.json())
        except Exception:
            pass


def main():
    st.set_page_config(page_title="Medical Diagnosis Assistant", page_icon="🩺")

    st.title("🩺 Medical Report AI Assistant")

    # Sidebar auth
    auth_section()

    if st.session_state.get("user"):
        st.success(f"Logged in as: {st.session_state['user']}")
    else:
        st.info("Please login or sign up from the sidebar.")

    tab1, tab2, tab3 = st.tabs(["Upload Report", "Ask Question", "History"])

    with tab1:
        upload_report_tab()
    with tab2:
        ask_question_tab()
    with tab3:
        history_tab()


if __name__ == "__main__":
    main()
