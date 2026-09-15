import os
import json
import re
from google import genai
from PIL import Image, ImageDraw, ImageFont
from dotenv import load_dotenv  # 追加

# .envファイルの中身を読み込んで、自動的にOSの環境変数にセットする
load_dotenv()

# Gemini APIに画像を送り、生レスポンス文字列を取得する関数
def detect_object(image_path: str) -> str:
    
    # load_dotenv()のおかげで、既に環境変数にキーがセットされています。
    # セットされていない場合だけ分かりやすいエラーを出すようにします。
    if not os.environ.get("GEMINI_API_KEY"):
        raise ValueError("APIキーが設定されていません。.envファイルが正しく作られているか確認してください。")

    if not os.path.exists(image_path):
        raise FileNotFoundError(f"画像ファイル '{image_path}' が見つかりません。")

    print("Gemini APIクライアントを初期化中...")
    client = genai.Client()  # genai.Client() は環境変数の GEMINI_API_KEY を勝手に読んでくれます

    print("画像を読み込み中...")
    image = Image.open(image_path)

    prompt = """
    Analyze this messy room/desk image. 
    Identify all garbage, scattered clothes, papers, books, and small items that need to be cleaned up.
    Please do not detect items if they are in their proper place—for example, a book on a bookshelf or trash inside a trash can.
    Output ONLY a JSON array containing objects with "name" (in English) and "box_2d" (normalized 0-1000 scale as [ymin, xmin, ymax, xmax]).
    Do not include any markdown formatting like ```json or explanation, just the raw JSON array string.
    """

    print("Gemini APIにリクエストを送信中...")
    response = client.models.generate_content(
        model='gemini-3.6-flash',
        contents=[image, prompt]
    )

    return response.text


# GeminiのレスポンスからJSONをパースし、指定パスにファイルとして保存する関数
def make_detections_json(response_text: str) -> str:
    output_json_path = "detections.json"                              # 中間生成されるJSONファイル名
    raw_text = response_text.strip()

    # response_textから余計なマークダウン記法を削除
    cleaned_text = re.sub(r"^```json\s*", "", raw_text, flags=re.IGNORECASE)
    cleaned_text = re.sub(r"^```\s*", "", cleaned_text)
    cleaned_text = re.sub(r"\s*```$", "", cleaned_text)

    try:
        parsed_data = json.loads(cleaned_text.strip())
    except json.JSONDecodeError as e:
        print(f"JSONパースエラー: {e}")
        print(f"実際のレスポンス:\n{raw_text}")
        raise e

    with open(output_json_path, 'w', encoding='utf-8') as f:
        json.dump(parsed_data, f, ensure_ascii=False, indent=2)

    print(f"JSONファイルを生成/更新しました: {output_json_path}")
    return output_json_path

# JSONファイルと画像ファイルを読み込み、バウンディングボックスを描画して保存する関数
def draw_boxes_from_json(image_path: str) -> str:
    json_path = "detections.json"                              # 中間生成されるJSONファイル名
    output_image_path = "output_image.png"                          # 最終的な出力画像名
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"画像 '{image_path}' が見つかりません。")
    if not os.path.exists(json_path):
        raise FileNotFoundError(f"JSONファイル '{json_path}' が見つかりません。")

    img = Image.open(image_path)
    width, height = img.size
    draw = ImageDraw.Draw(img)

    with open(json_path, 'r', encoding='utf-8') as f:
        detections = json.load(f)

    print(f"{len(detections)}件のオブジェクトを描画します...")

    font_path = "/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc"
    try:
        font = ImageFont.truetype(font_path, 12)
    except IOError:
        font = ImageFont.load_default()

    for item in detections:
        name = item.get("name", "unknown")
        box = item.get("box_2d", [])

        if len(box) != 4:
            continue

        ymin, xmin, ymax, xmax = box

        ymin_px = (ymin / 1000.0) * height
        xmin_px = (xmin / 1000.0) * width
        ymax_px = (ymax / 1000.0) * height
        xmax_px = (xmax / 1000.0) * width

        draw.rectangle([xmin_px, ymin_px, xmax_px, ymax_px], outline="red", width=3)

        text = f"{name}"
        text_bg = [xmin_px, max(0, ymin_px - 15), xmin_px + len(text) * 7, ymin_px]
        draw.rectangle(text_bg, fill="black")
        draw.text((xmin_px + 2, max(0, ymin_px - 15)), text, fill="white", font=font)

    img.save(output_image_path)
    print(f"出力画像を保存しました: {output_image_path}")
    return output_image_path