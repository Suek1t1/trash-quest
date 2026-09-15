import os
import io
from google.cloud import vision
from PIL import Image, ImageDraw, ImageFont

# 認証情報の設定
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "thumbnail-analysis-research-ad4fe8627de1.json"

def detect_and_draw_objects(input_path, output_path):
    """
    Vision APIを使って物体を検出し、画像にバウンディングボックスを描画する
    """
    print("Vision APIクライアントを初期化中...")
    client = vision.ImageAnnotatorClient()

    # 画像の読み込み
    with io.open(input_path, 'rb') as image_file:
        content = image_file.read()
    image = vision.Image(content=content)

    # APIを呼び出して物体検出 (Object Localization)
    print("APIにリクエストを送信中...")
    response = client.object_localization(image=image)
    objects = response.localized_object_annotations

    if not objects:
        print("物体が検出されませんでした。")
        return

    print(f"\n検出された物体数: {len(objects)}")
    
    # 画像に枠を描画するための準備
    img = Image.open(input_path)
    draw = ImageDraw.Draw(img)
    width, height = img.size

    for obj in objects:
        name = obj.name
        score = obj.score
        
        print(f"\n物体名: {name} (信頼度: {score:.2f})")
        
        # Vision APIの座標は0.0〜1.0の正規化された値(normalized_vertices)で返ってくるため、
        # 実際の画像の幅と高さを掛けてピクセル座標に変換する
        vertices = obj.bounding_poly.normalized_vertices
        
        # 矩形の左上(min_x, min_y)と右下(max_x, max_y)の座標を計算
        min_x = min([v.x for v in vertices]) * width
        max_x = max([v.x for v in vertices]) * width
        min_y = min([v.y for v in vertices]) * height
        max_y = max([v.y for v in vertices]) * height

        # 座標の出力
        print(f"  バウンディングボックス座標: ({min_x:.1f}, {min_y:.1f}) - ({max_x:.1f}, {max_y:.1f})")

        # 枠線を描画 (赤色、太さ4ピクセル)
        draw.rectangle([min_x, min_y, max_x, max_y], outline="red", width=4)
        
        # ラベルテキストを描画
        text = f"{name} ({score:.2f})"
        
        # 文字の背景を黒く塗りつぶして読みやすくする
        # （フォントサイズを細かく制御する場合はImageFontを使いますが、今回はデフォルトで実装）
        text_bg_box = [min_x, min_y - 15, min_x + len(text)*6, min_y]
        draw.rectangle(text_bg_box, fill="black")
        draw.text((min_x + 2, min_y - 15), text, fill="white")

    # 加工した画像を保存
    img.save(output_path)
    print(f"\nバウンディングボックスを描画した画像を保存しました: {output_path}")

if __name__ == "__main__":
    # 共有いただいたファイル名を入力画像として指定
    input_image = "image2.png"
    output_image = "detected_output2.png"
    
    if os.path.exists(input_image):
        detect_and_draw_objects(input_image, output_image)
    else:
        print(f"エラー: 画像ファイル '{input_image}' が同じディレクトリに見つかりません。")