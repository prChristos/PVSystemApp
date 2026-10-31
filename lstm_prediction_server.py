import base64
from io import BytesIO
from flask import Flask, request, jsonify
from tensorflow.keras.models import Sequential # type: ignore
from tensorflow.keras.layers import LSTM, Dense # type: ignore
from tensorflow.keras.optimizers import Adam # type: ignore
from sklearn.preprocessing import MinMaxScaler # type: ignore
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error # type: ignore
import numpy as np
import matplotlib.pyplot as plt

app = Flask(__name__)


@app.route('/start-prediction', methods=['POST'])
def start_prediction():
    """
    Trains an LSTM model on the datasets sent by the frontend and returns
    the evaluation results.

    Returns JSON with the metrics text and two base64-encoded PNG plots.
    """
    data = request.json
    model_type = data['model']
    hyperparameters = data['hyperparameters']
    datasets = data['datasets']

    # Unpack the train / validation / test sets into NumPy arrays
    X_train = np.array(datasets[0]['x'])
    y_train = np.array(datasets[0]['y'])
    X_valid = np.array(datasets[1]['x'])
    y_valid = np.array(datasets[1]['y'])
    X_test = np.array(datasets[2]['x'])
    y_test = np.array(datasets[2]['y'])

    # An LSTM learns from sequences, so each sample becomes a window of the
    # last 10 time steps, and the target is the value right after the window
    sequence_length = 10

    def prepare_sequences(X, y):
        X_seq, y_seq = [], []
        for i in range(len(X) - sequence_length):
            X_seq.append(X[i:i + sequence_length])
            y_seq.append(y[i + sequence_length])
        return np.array(X_seq), np.array(y_seq)

    X_train_seq, y_train_seq = prepare_sequences(X_train, y_train)
    X_valid_seq, y_valid_seq = prepare_sequences(X_valid, y_valid)
    X_test_seq, y_test_seq = prepare_sequences(X_test, y_test)

    # Two stacked LSTM layers followed by a single output neuron.
    # The first layer passes its full sequence on to the second one.
    model = Sequential()
    model.add(LSTM(units=100, return_sequences=True, input_shape=(X_train_seq.shape[1], X_train_seq.shape[2])))
    model.add(LSTM(units=50))
    model.add(Dense(units=1))
    model.compile(optimizer=Adam(learning_rate=hyperparameters.get('learning_rate', 0.001)), loss='mean_squared_error')

    # Train the model; the validation set is used to monitor overfitting.
    # Defaults: 20 epochs, batch size 32.
    history = model.fit(X_train_seq, y_train_seq, epochs=int(hyperparameters.get('epochs', 20)),
                        batch_size=int(hyperparameters.get('batch_size', 32)),
                        validation_data=(X_valid_seq, y_valid_seq))

    # Evaluate on the test set, which the model has never seen
    y_pred = model.predict(X_test_seq)
    mse = mean_squared_error(y_test_seq, y_pred)
    r2 = r2_score(y_test_seq, y_pred)

    # Training vs validation loss per epoch
    loss_plot = plot_to_base64(history, 'loss')

    # Real test values against the model's predictions
    actual_vs_predicted_plot = plot_to_base64(y_test_seq, y_pred, 'Actual vs Predicted')

    return jsonify({
        'metrics': f'MSE: {mse:.4f}, R²: {r2:.4f}',
        'loss_plot': loss_plot,
        'actual_vs_predicted': actual_vs_predicted_plot
    })


def plot_to_base64(history_or_y_test, y_pred=None, plot_type='loss'):
    """
    Draws a plot and returns it as a base64 PNG string, so the frontend can
    show it directly in an <img> tag.

    Two modes:
      - plot_type == 'loss': the first argument is the Keras training
        history, and the plot shows train and validation loss.
      - anything else: the first argument is the actual values and y_pred
        the predicted ones, drawn on top of each other.
    """
    plt.figure(figsize=(10, 6))
    if plot_type == 'loss':
        plt.plot(history_or_y_test.history['loss'], label='Train Loss')
        plt.plot(history_or_y_test.history['val_loss'], label='Validation Loss')
        plt.title('Loss over Epochs')
    else:
        plt.plot(history_or_y_test, label='Actual')
        plt.plot(y_pred, label='Predicted', alpha=0.6)
        plt.title('Actual vs Predicted')
    plt.legend()
    plt.grid(True)

    # Save the figure to memory instead of a file, then encode it as text
    buf = BytesIO()
    plt.savefig(buf, format='png')
    buf.seek(0)
    image_base64 = base64.b64encode(buf.read()).decode('utf-8')
    buf.close()
    return image_base64


if __name__ == '__main__':
    app.run(debug=True)
