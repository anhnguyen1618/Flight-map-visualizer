from flask import Flask, render_template, request

app = Flask(__name__)

@app.route("/")
def index_page():
    return render_template("index.html")

'''
@app.route("/upload", methods=["POST"])
def upload():
    if request.files:
        print (request.files)
        file = request.files['record']
        file_name = str(uuid.uuid1()) + ".csv"
        file_path = os.path.join(FILE_UPLOAD_DIR, file_name)
        file.save(file_path)
        ingest.ingest(file_path)
    return "ok"
'''

if __name__ == "__main__":
    app.run(debug=True)