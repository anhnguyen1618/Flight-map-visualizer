from flask import Flask, render_template, request, abort
import json
import os

# Source http://techslides.com/list-of-countries-and-capitals
CAPITAL_JSON_FILE_NAME = 'capitals.json'

debug = os.getenv('DEVELOPMENT_MODE', False)

app = Flask(__name__)

@app.route("/")
def index_page():
    return render_template("index.html")


@app.route("/capitals", methods=["GET"])
def capitals():
    with open("capitals.json") as file: 
        data = json.load(file)
        return json.dumps(data)

if __name__ == "__main__":
    app.run(debug=debug, port=5000, host="0.0.0.0")