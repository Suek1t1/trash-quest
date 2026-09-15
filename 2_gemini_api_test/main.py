from utils import detect_object, make_detections_json, draw_boxes_from_json

# 設定
INPUT_IMAGE = "2_gemini_api_test/image.png"  # テストする画像ファイル名

def main():
    print("--- 処理を開始します ---")
    
    try:
        # 1. Geminiに検出を依頼してレスポンス(文字列)を取得
        response_text = detect_object(INPUT_IMAGE)
        
        # 2. レスポンスをパースしてJSONファイルを生成（上書き）
        make_detections_json(response_text)
        
        # 3. 生成されたJSONと画像をもとにバウンディングボックスを描画
        draw_boxes_from_json(image_path=INPUT_IMAGE)
        
        print("--- すべての処理が正常に完了しました！ ---")

    except Exception as e:
        print(f"\nエラーが発生しました: {e}")

if __name__ == "__main__":
    main()