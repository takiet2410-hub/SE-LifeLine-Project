import gradio as gr
from main import app as fastapi_app
import uvicorn

# Khởi tạo một giao diện Gradio giả (dummy) để thỏa mãn yêu cầu của Hugging Face
# Nó hoàn toàn không làm ảnh hưởng đến các API hiện tại của bạn.
def system_status():
    return "LifeLine AI Service API is running perfectly in the background."

demo = gr.Interface(
    fn=system_status, 
    inputs=[], 
    outputs="text", 
    title="LifeLine AI Status"
)

# Gắn Gradio UI vào một đường dẫn phụ (/ui) để không đụng chạm đến các endpoint FastAPI hiện tại của bạn
app = gr.mount_gradio_app(fastapi_app, demo, path="/ui")

if __name__ == "__main__":
    # Hugging Face bắt buộc chạy trên port 7860 và host 0.0.0.0
    uvicorn.run(app, host="0.0.0.0", port=7860)
