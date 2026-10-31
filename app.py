from flask import Flask, request, jsonify

app = Flask(__name__)


def predict_production(weather_data):
    """
    Placeholder model that estimates PV production from weather data.

    It uses a simple hand-made formula so the API can be tested end to end.
    Swap the body of this function for real model inference (e.g. the LSTM
    from lstm_prediction_server.py) once a trained model is available.

    Expected keys in weather_data (all optional, default to 0):
        temperature, humidity, irradiance
    """
    temperature = weather_data.get('temperature', 0)
    humidity = weather_data.get('humidity', 0)
    irradiance = weather_data.get('irradiance', 0)

    # Rough linear estimate: warmth and sunlight help, humidity hurts.
    # The coefficients are arbitrary and NOT fitted to real data.
    production = (temperature * 0.5) + (irradiance * 0.7) - (humidity * 0.2)

    # Production can't be negative, so clamp at zero
    return max(production, 0)


@app.route('/')
def home():
    return "PV System Prediction Backend is Running!"


@app.route('/predict', methods=['POST'])
def predict():
    """
    Returns a production estimate for the given weather data.

    Example request body:
        {"weatherData": {"temperature": 25, "humidity": 40, "irradiance": 600}}

    Example response:
        {"predicted_production": 432.5}
    """
    try:
        # The frontend sends the weather values under the "weatherData" key
        data = request.json
        weather_data = data.get('weatherData', {})

        prediction = predict_production(weather_data)

        return jsonify({
            "predicted_production": round(prediction, 2)
        })
    except Exception as e:
        # Bad or missing JSON ends up here; report it as a client error (400)
        return jsonify({"error": str(e)}), 400


if __name__ == '__main__':
    # debug=True gives auto-reload and detailed errors.
    # Turn it off before deploying anywhere public.
    app.run(debug=True)
