from http.server import BaseHTTPRequestHandler
import json
import base64
import os
import tempfile

# 同じ api フォルダ内にある utils.py からインポート
from .utils import detect_object, make_detections_json, draw_boxes_from_json

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # 1. フロントエンドから送られてきたデータ（JSON形式で画像を受け取る想定）を設定
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            body = json.loads(post_data.decode('utf-8'))
            
            # フロントからBase64エンコードされた画像データが送られてくると仮定
            image_base64 = body.get("image")
            
            if not image_base64:
                self._send_error(400, "画像データが見つかりません。")
                return

            # 2. Vercelのサーバー上の一時フォルダに画像を保存する
            # (サーバーレス環境では書き込み可能な場所が /tmp のみのため)
            with tempfile.TemporaryDirectory() as temp_dir:
                input_image_path = os.path.join(temp_dir, "input.png")
                
                # Base64をデコードして画像ファイルとして保存
                image_data = base64.b64decode(image_base64.split(",")[1] if "," in image_base64 else image_base64)
                with open(input_image_path, "wb") as f:
                    f.write(image_data)

                # --- main.py と同じ一連の処理を実行 ---
                # 1. Geminiに検出を依頼
                response_text = detect_object(input_image_path)
                
                # 2. JSONを生成（※utils.py側で一時ディレクトリのパスを考慮できるか要確認ですが、ロジックは同じです）
                make_detections_json(response_text)
                
                # 3. バウンディングボックスを描画（加工後の画像ができる）
                draw_boxes_from_json(image_path=input_image_path)
                
                # utils.py が生成した 'output_image.png' を読み込むように変更
                output_image_path = "output_image.png"
                
                with open(output_image_path, "rb") as f:
                    processed_image_binary = f.read()
                
                processed_image_base64 = base64.b64encode(processed_image_binary).decode('utf-8')

                # Vercelなどのサーバー上で不要なゴミが残らないように使い終わったら削除しておく
                if os.path.exists(output_image_path):
                    os.remove(output_image_path)
                    
# utils.py が作成した detections.json から魔物の数をカウントする
                monster_count = 0
                if os.path.exists("detections.json"):
                    with open("detections.json", "r", encoding="utf-8") as jf:
                        detections = json.load(jf)
                        monster_count = len(detections) # 見つかったゴミの数
                        
            # 3. フロントエンド（リザルト画面）へ加工済み画像を返す
            self.send_response(200)
            self.send_header('Content-type', 'application/json; charset=utf-8')
            self.end_headers()
            
            response_data = {
                "status": "success",
                "processed_image": f"data:image/png;base64,{processed_image_base64}",
                "monster_count": monster_count
            }
            self.wfile.write(json.dumps(response_data).encode('utf-8'))

        except Exception as e:
            self._send_error(500, str(e))

    def _send_error(self, code, message):
        self.send_response(code)
        self.send_header('Content-type', 'application/json; charset=utf-8')
        self.end_headers()
        error_data = {"status": "error", "message": message}
        self.wfile.write(json.dumps(error_data).encode('utf-8'))