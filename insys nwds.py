#!/usr/bin/env python
# coding: utf-8

# In[2]:


import pandas as pd

passenger_df = pd.read_csv(
    r"C:\Users\mariy\passenger_flow.csv"
)

print("Shape:", passenger_df.shape)
print(passenger_df.head())
print(passenger_df.columns.tolist())


# In[3]:


passenger_df["timestamp"] = pd.to_datetime(
    passenger_df["timestamp"]
)

passenger_df = passenger_df.sort_values(
    ["station_id", "timestamp"]
).reset_index(drop=True)

passenger_df["future_entries"] = (
    passenger_df.groupby("station_id")["entries"]
    .shift(-1)
)

print("Shape:", passenger_df.shape)
print(
    "Missing future_entries:",
    passenger_df["future_entries"].isna().sum()
)


# In[4]:


passenger_df = passenger_df.dropna(
    subset=["future_entries"]
).copy()

passenger_df["future_entries"] = passenger_df[
    "future_entries"
].astype(int)

print("Shape after removing missing targets:", passenger_df.shape)
print(
    "Missing future_entries:",
    passenger_df["future_entries"].isna().sum()
)


# In[5]:


print("Start:", passenger_df["timestamp"].min())
print("End:", passenger_df["timestamp"].max())


# In[6]:


train_df = passenger_df[
    passenger_df["timestamp"] < "2026-06-01"
].copy()

test_df = passenger_df[
    passenger_df["timestamp"] >= "2026-06-01"
].copy()

print("Training data:")
print("Rows:", len(train_df))
print("Start:", train_df["timestamp"].min())
print("End:", train_df["timestamp"].max())

print("\nTesting data:")
print("Rows:", len(test_df))
print("Start:", test_df["timestamp"].min())
print("End:", test_df["timestamp"].max())


# In[7]:


lstm_features = [
    "entries",
    "exits",
    "hour",
    "day_of_week",
    "is_weekend",
    "event_nearby"
]

X_train = train_df[lstm_features]
y_train = train_df["future_entries"]

X_test = test_df[lstm_features]
y_test = test_df["future_entries"]

print("Training features:", X_train.shape)
print("Testing features:", X_test.shape)
print("Training target:", y_train.shape)
print("Testing target:", y_test.shape)


# In[8]:


from sklearn.preprocessing import MinMaxScaler

feature_scaler = MinMaxScaler()
target_scaler = MinMaxScaler()

X_train_scaled = feature_scaler.fit_transform(X_train)
X_test_scaled = feature_scaler.transform(X_test)

y_train_scaled = target_scaler.fit_transform(
    y_train.to_numpy().reshape(-1, 1)
)

y_test_scaled = target_scaler.transform(
    y_test.to_numpy().reshape(-1, 1)
)

print("Scaled training features:", X_train_scaled.shape)
print("Scaled testing features:", X_test_scaled.shape)
print("Scaled training target:", y_train_scaled.shape)
print("Scaled testing target:", y_test_scaled.shape)


# In[9]:


import numpy as np

sequence_length = 24

def create_sequences(X, y, sequence_length):
    X_seq = []
    y_seq = []

    for i in range(sequence_length, len(X)):
        X_seq.append(X[i-sequence_length:i])
        y_seq.append(y[i])

    return np.array(X_seq), np.array(y_seq).reshape(-1)

X_train_seq, y_train_seq = create_sequences(
    X_train_scaled,
    y_train_scaled,
    sequence_length
)

X_test_seq, y_test_seq = create_sequences(
    X_test_scaled,
    y_test_scaled,
    sequence_length
)

print("X_train sequence shape:", X_train_seq.shape)
print("y_train sequence shape:", y_train_seq.shape)
print("X_test sequence shape:", X_test_seq.shape)
print("y_test sequence shape:", y_test_seq.shape)


# In[10]:


import numpy as np

sequence_length = 24

def create_station_sequences(df, feature_scaler, target_scaler):
    X_sequences = []
    y_sequences = []

    for station_id, station_data in df.groupby("station_id"):
        station_data = station_data.sort_values("timestamp")

        X = feature_scaler.transform(
            station_data[lstm_features]
        )

        y = target_scaler.transform(
            station_data["future_entries"]
            .to_numpy()
            .reshape(-1, 1)
        ).reshape(-1)

        for i in range(sequence_length, len(station_data)):
            X_sequences.append(
                X[i-sequence_length:i]
            )
            y_sequences.append(y[i])

    return (
        np.array(X_sequences),
        np.array(y_sequences)
    )


X_train_seq, y_train_seq = create_station_sequences(
    train_df,
    feature_scaler,
    target_scaler
)

X_test_seq, y_test_seq = create_station_sequences(
    test_df,
    feature_scaler,
    target_scaler
)

print("Station-safe training sequence:", X_train_seq.shape)
print("Station-safe training target:", y_train_seq.shape)
print("Station-safe testing sequence:", X_test_seq.shape)
print("Station-safe testing target:", y_test_seq.shape)


# In[11]:


from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Input, LSTM, Dropout, Dense

lstm_model = Sequential([
    Input(shape=(24, 6)),
    LSTM(64),
    Dropout(0.2),
    Dense(32, activation="relu"),
    Dense(1)
])

lstm_model.compile(
    optimizer="adam",
    loss="mse",
    metrics=["mae"]
)

lstm_model.summary()


# In[13]:


from tensorflow.keras.callbacks import EarlyStopping

early_stopping = EarlyStopping(
    monitor="val_loss",
    patience=3,
    restore_best_weights=True
)

history = lstm_model.fit(
    X_train_seq,
    y_train_seq,
    validation_split=0.1,
    epochs=20,
    batch_size=64,
    callbacks=[early_stopping],
    verbose=1
)


# In[14]:


y_pred_scaled = lstm_model.predict(
    X_test_seq,
    batch_size=256
)

print("Prediction shape:", y_pred_scaled.shape)


# In[15]:


y_pred = target_scaler.inverse_transform(
    y_pred_scaled
).reshape(-1)

y_actual = target_scaler.inverse_transform(
    y_test_seq.reshape(-1, 1)
).reshape(-1)

print("Predictions shape:", y_pred.shape)
print("Actual values shape:", y_actual.shape)

print("\nSample predictions:")

for i in range(10):
    print(
        f"Actual: {y_actual[i]:.0f} | "
        f"Predicted: {y_pred[i]:.0f}"
    )


# In[16]:


from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import numpy as np

mae = mean_absolute_error(y_actual, y_pred)
rmse = np.sqrt(mean_squared_error(y_actual, y_pred))
r2 = r2_score(y_actual, y_pred)

print("New LSTM Results")
print("----------------")
print(f"MAE  : {mae:.2f}")
print(f"RMSE : {rmse:.2f}")
print(f"R²   : {r2:.4f}")


# In[17]:


from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import numpy as np

linear_model = LinearRegression()

linear_model.fit(
    X_train,
    y_train
)

linear_predictions = linear_model.predict(X_test)

linear_mae = mean_absolute_error(
    y_test,
    linear_predictions
)

linear_rmse = np.sqrt(
    mean_squared_error(y_test, linear_predictions)
)

linear_r2 = r2_score(
    y_test,
    linear_predictions
)

print("Linear Regression Results")
print("-------------------------")
print(f"MAE  : {linear_mae:.2f}")
print(f"RMSE : {linear_rmse:.2f}")
print(f"R²   : {linear_r2:.4f}")


# In[18]:


from xgboost import XGBRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import numpy as np

xgb_regressor = XGBRegressor(
    n_estimators=300,
    max_depth=8,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42,
    n_jobs=-1
)

xgb_regressor.fit(
    X_train,
    y_train
)

xgb_predictions = xgb_regressor.predict(X_test)

xgb_mae = mean_absolute_error(
    y_test,
    xgb_predictions
)

xgb_rmse = np.sqrt(
    mean_squared_error(y_test, xgb_predictions)
)

xgb_r2 = r2_score(
    y_test,
    xgb_predictions
)

print("XGBoost Regressor Results")
print("-------------------------")
print(f"MAE  : {xgb_mae:.2f}")
print(f"RMSE : {xgb_rmse:.2f}")
print(f"R²   : {xgb_r2:.4f}")


# In[19]:


classification_features = [
    "city",
    "station_name",
    "line",
    "station_type",
    "hour",
    "day_of_week",
    "is_weekend",
    "weather",
    "event_nearby",
    "entries",
    "exits"
]

X_train_clf = train_df[classification_features].copy()
y_train_clf = train_df["crowding_label"].copy()

X_test_clf = test_df[classification_features].copy()
y_test_clf = test_df["crowding_label"].copy()

print("Classification training data:", X_train_clf.shape)
print("Classification testing data:", X_test_clf.shape)

print("\nClasses:")
print(y_train_clf.value_counts())


# In[20]:


from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer

categorical_features = [
    "city",
    "station_name",
    "line",
    "station_type",
    "weather"
]

numeric_features = [
    "hour",
    "day_of_week",
    "is_weekend",
    "event_nearby",
    "entries",
    "exits"
]

preprocessor = ColumnTransformer(
    transformers=[
        (
            "cat",
            OneHotEncoder(
                handle_unknown="ignore",
                sparse_output=False
            ),
            categorical_features
        )
    ],
    remainder="passthrough"
)

X_train_encoded = preprocessor.fit_transform(X_train_clf)
X_test_encoded = preprocessor.transform(X_test_clf)

print("Encoded training shape:", X_train_encoded.shape)
print("Encoded testing shape:", X_test_encoded.shape)


# In[21]:


from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

decision_tree = DecisionTreeClassifier(
    max_depth=12,
    random_state=42
)

decision_tree.fit(
    X_train_encoded,
    y_train_clf
)

dt_predictions = decision_tree.predict(
    X_test_encoded
)

dt_accuracy = accuracy_score(
    y_test_clf,
    dt_predictions
)

dt_precision = precision_score(
    y_test_clf,
    dt_predictions,
    average="weighted"
)

dt_recall = recall_score(
    y_test_clf,
    dt_predictions,
    average="weighted"
)

dt_f1 = f1_score(
    y_test_clf,
    dt_predictions,
    average="weighted"
)

print("Decision Tree Results")
print("---------------------")
print(f"Accuracy  : {dt_accuracy:.4f}")
print(f"Precision : {dt_precision:.4f}")
print(f"Recall    : {dt_recall:.4f}")
print(f"F1 Score  : {dt_f1:.4f}")


# In[22]:


print(
    passenger_df.groupby("crowding_label")["crowding_index"]
    .agg(["min", "max", "mean"])
)


# In[23]:


print("Training accuracy:",
      decision_tree.score(X_train_encoded, y_train_clf))

print("Testing accuracy:",
      decision_tree.score(X_test_encoded, y_test_clf))


# In[24]:


from sklearn.ensemble import RandomForestClassifier

random_forest = RandomForestClassifier(
    n_estimators=100,
    max_depth=12,
    random_state=42,
    n_jobs=-1
)

random_forest.fit(
    X_train_encoded,
    y_train_clf
)

rf_predictions = random_forest.predict(
    X_test_encoded
)

rf_accuracy = accuracy_score(
    y_test_clf,
    rf_predictions
)

rf_precision = precision_score(
    y_test_clf,
    rf_predictions,
    average="weighted"
)

rf_recall = recall_score(
    y_test_clf,
    rf_predictions,
    average="weighted"
)

rf_f1 = f1_score(
    y_test_clf,
    rf_predictions,
    average="weighted"
)

print("Random Forest Results")
print("---------------------")
print(f"Accuracy  : {rf_accuracy:.4f}")
print(f"Precision : {rf_precision:.4f}")
print(f"Recall    : {rf_recall:.4f}")
print(f"F1 Score  : {rf_f1:.4f}")


# In[25]:


from xgboost import XGBClassifier
from sklearn.preprocessing import LabelEncoder

label_encoder = LabelEncoder()

y_train_encoded = label_encoder.fit_transform(y_train_clf)
y_test_encoded = label_encoder.transform(y_test_clf)

xgb_classifier = XGBClassifier(
    n_estimators=300,
    max_depth=8,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42,
    n_jobs=-1,
    eval_metric="mlogloss"
)

xgb_classifier.fit(
    X_train_encoded,
    y_train_encoded
)

xgb_clf_predictions = xgb_classifier.predict(
    X_test_encoded
)

xgb_clf_accuracy = accuracy_score(
    y_test_encoded,
    xgb_clf_predictions
)

xgb_clf_precision = precision_score(
    y_test_encoded,
    xgb_clf_predictions,
    average="weighted"
)

xgb_clf_recall = recall_score(
    y_test_encoded,
    xgb_clf_predictions,
    average="weighted"
)

xgb_clf_f1 = f1_score(
    y_test_encoded,
    xgb_clf_predictions,
    average="weighted"
)

print("XGBoost Classifier Results")
print("--------------------------")
print(f"Accuracy  : {xgb_clf_accuracy:.4f}")
print(f"Precision : {xgb_clf_precision:.4f}")
print(f"Recall    : {xgb_clf_recall:.4f}")
print(f"F1 Score  : {xgb_clf_f1:.4f}")


# In[26]:


import os

for file in os.listdir():
    if file.endswith((".keras", ".pkl", ".joblib")):
        print(file)


# In[27]:


import tensorflow as tf
import joblib

loaded_lstm = tf.keras.models.load_model(
    "metroflow_lstm.keras"
)

loaded_feature_scaler = joblib.load(
    "metroflow_feature_scaler.pkl"
)

loaded_target_scaler = joblib.load(
    "metroflow_target_scaler.pkl"
)

print("LSTM loaded:", loaded_lstm is not None)
print("Feature scaler loaded:", loaded_feature_scaler is not None)
print("Target scaler loaded:", loaded_target_scaler is not None)


# In[28]:


def predict_next_hour(station_data):
    station_data = station_data.sort_values("timestamp").copy()

    if len(station_data) < 24:
        raise ValueError("At least 24 hours of station data are required.")

    latest_24 = station_data.tail(24)

    X = latest_24[lstm_features]

    X_scaled = loaded_feature_scaler.transform(X)

    X_sequence = X_scaled.reshape(1, 24, 6)

    prediction_scaled = loaded_lstm.predict(
        X_sequence,
        verbose=0
    )

    prediction = loaded_target_scaler.inverse_transform(
        prediction_scaled
    )[0, 0]

    return max(0, prediction)


# In[29]:


test_station_id = passenger_df["station_id"].iloc[0]

station_data = passenger_df[
    passenger_df["station_id"] == test_station_id
].copy()

prediction = predict_next_hour(station_data)

print("Station:", test_station_id)
print(f"Predicted next-hour entries: {prediction:.0f}")


# In[31]:


import os

for file in os.listdir():
    if "tree" in file.lower() or "preprocess" in file.lower() or "classifier" in file.lower():
        print(file)


# In[32]:


import joblib

joblib.dump(
    decision_tree,
    "metroflow_decision_tree.pkl"
)

joblib.dump(
    preprocessor,
    "metroflow_classification_preprocessor.pkl"
)

print("Decision Tree saved:", os.path.exists("metroflow_decision_tree.pkl"))
print(
    "Preprocessor saved:",
    os.path.exists("metroflow_classification_preprocessor.pkl")
)


# In[33]:


loaded_decision_tree = joblib.load(
    "metroflow_decision_tree.pkl"
)

loaded_classification_preprocessor = joblib.load(
    "metroflow_classification_preprocessor.pkl"
)

print(
    "Decision Tree loaded:",
    loaded_decision_tree is not None
)

print(
    "Classification preprocessor loaded:",
    loaded_classification_preprocessor is not None
)


# In[34]:


classification_features = [
    "city",
    "station_name",
    "line",
    "station_type",
    "hour",
    "day_of_week",
    "is_weekend",
    "weather",
    "event_nearby",
    "entries",
    "exits"
]

def predict_crowding(station_data):
    latest = station_data.sort_values("timestamp").tail(1)

    X = latest[classification_features]

    X_encoded = loaded_classification_preprocessor.transform(X)

    prediction = loaded_decision_tree.predict(X_encoded)

    return prediction[0]


# In[35]:


crowding_prediction = predict_crowding(station_data)

print("Station:", test_station_id)
print("Predicted crowd level:", crowding_prediction)


# In[36]:


def metroflow_predict(station_data):
    passenger_prediction = predict_next_hour(station_data)
    crowd_prediction = predict_crowding(station_data)

    return {
        "predicted_entries": round(passenger_prediction),
        "predicted_crowding": crowd_prediction
    }


# In[37]:


result = metroflow_predict(station_data)

print("MetroFlow Prediction")
print("--------------------")
print("Station:", test_station_id)
print("Predicted next-hour entries:", result["predicted_entries"])
print("Predicted crowd level:", result["predicted_crowding"])


# In[38]:


def predict_station(station_id):
    station_data = passenger_df[
        passenger_df["station_id"] == station_id
    ].copy()

    if len(station_data) == 0:
        raise ValueError("Station ID not found.")

    if len(station_data) < 24:
        raise ValueError("Not enough data for this station.")

    result = metroflow_predict(station_data)

    return {
        "station_id": station_id,
        "predicted_entries": result["predicted_entries"],
        "predicted_crowding": result["predicted_crowding"]
    }


# In[39]:


station_ids = passenger_df["station_id"].unique()

print("Number of stations:", len(station_ids))
print("Example station IDs:", station_ids[:5])


# In[40]:


for station_id in station_ids[:5]:
    result = predict_station(station_id)
    print(result)


# In[41]:


def get_metroflow_prediction(station_id):
    station_data = passenger_df[
        passenger_df["station_id"] == station_id
    ].copy()

    if len(station_data) < 24:
        raise ValueError("Not enough data for this station.")

    result = metroflow_predict(station_data)

    latest = station_data.sort_values("timestamp").iloc[-1]

    return {
        "station_id": station_id,
        "station_name": latest["station_name"],
        "city": latest["city"],
        "predicted_entries": result["predicted_entries"],
        "predicted_crowding": result["predicted_crowding"]
    }


# In[42]:


result = get_metroflow_prediction("STN-AMD-BL-01")

print(result)


# In[45]:


get_ipython().run_cell_magic('writefile', 'metroflow_ml.py', '\nimport pandas as pd\nimport numpy as np\nimport tensorflow as tf\nimport joblib\n\n# Load saved models and scalers\nlstm_model = tf.keras.models.load_model("metroflow_lstm.keras")\nfeature_scaler = joblib.load("metroflow_feature_scaler.pkl")\ntarget_scaler = joblib.load("metroflow_target_scaler.pkl")\n\ndecision_tree = joblib.load("metroflow_decision_tree.pkl")\nclassification_preprocessor = joblib.load(\n    "metroflow_classification_preprocessor.pkl"\n)\n\n# Features\nlstm_features = [\n    "entries",\n    "exits",\n    "hour",\n    "day_of_week",\n    "is_weekend",\n    "event_nearby"\n]\n\nclassification_features = [\n    "city",\n    "station_name",\n    "line",\n    "station_type",\n    "hour",\n    "day_of_week",\n    "is_weekend",\n    "weather",\n    "event_nearby",\n    "entries",\n    "exits"\n]\n\n\ndef predict_next_hour(station_data):\n    station_data = station_data.sort_values("timestamp").copy()\n\n    if len(station_data) < 24:\n        raise ValueError("At least 24 hours of data are required.")\n\n    latest_24 = station_data.tail(24)\n\n    X = latest_24[lstm_features]\n    X_scaled = feature_scaler.transform(X)\n\n    X_sequence = X_scaled.reshape(1, 24, 6)\n\n    prediction_scaled = lstm_model.predict(\n        X_sequence,\n        verbose=0\n    )\n\n    prediction = target_scaler.inverse_transform(\n        prediction_scaled\n    )[0, 0]\n\n    return max(0, prediction)\n\n\ndef predict_crowding(station_data):\n    latest = station_data.sort_values("timestamp").tail(1)\n\n    X = latest[classification_features]\n\n    X_encoded = classification_preprocessor.transform(X)\n\n    prediction = decision_tree.predict(X_encoded)\n\n    return prediction[0]\n\n\ndef get_metroflow_prediction(station_id, passenger_df):\n    station_data = passenger_df[\n        passenger_df["station_id"] == station_id\n    ].copy()\n\n    if len(station_data) < 24:\n        raise ValueError("Not enough data for this station.")\n\n    latest = station_data.sort_values("timestamp").iloc[-1]\n\n    predicted_entries = predict_next_hour(station_data)\n    predicted_crowding = predict_crowding(station_data)\n\n    return {\n        "station_id": station_id,\n        "station_name": latest["station_name"],\n        "city": latest["city"],\n        "predicted_entries": round(predicted_entries),\n        "predicted_crowding": predicted_crowding\n    }\n\n\nprint("MetroFlow ML module loaded successfully!")\n')


# In[46]:


import importlib
import metroflow_ml

importlib.reload(metroflow_ml)

print("Import successful!")


# In[47]:


from metroflow_ml import get_metroflow_prediction

result = get_metroflow_prediction(
    "STN-AMD-BL-01",
    passenger_df
)

print(result)


# In[48]:


stations_list = (
    passenger_df[
        ["station_id", "station_name", "city", "line"]
    ]
    .drop_duplicates()
    .sort_values(["city", "station_name"])
)

print("Total stations:", len(stations_list))
print(stations_list.to_string(index=False))


# In[49]:


station_id = "STN-AMD-BL-02"

result = get_metroflow_prediction(
    station_id,
    passenger_df
)

print("=== MetroFlow Dashboard Prediction ===")
print("Station ID       :", result["station_id"])
print("Station Name     :", result["station_name"])
print("City             :", result["city"])
print("Next-hour Entries:", result["predicted_entries"])
print("Crowding Level   :", result["predicted_crowding"])


# In[50]:


def predict_all_stations(passenger_df):
    results = []

    for station_id in passenger_df["station_id"].unique():

        try:
            result = get_metroflow_prediction(
                station_id,
                passenger_df
            )

            results.append(result)

        except ValueError:
            # Skip stations with insufficient data
            continue

    return pd.DataFrame(results)


# In[51]:


all_station_predictions = predict_all_stations(passenger_df)

print("Number of station predictions:",
      len(all_station_predictions))

print("\nPrediction table:")
print(all_station_predictions.head(10).to_string(index=False))


# In[52]:


print("Cities in prediction table:")
print(all_station_predictions["city"].value_counts())


# In[53]:


print(
    all_station_predictions
    .groupby("city")
    .head(3)
    .to_string(index=False)
)


# In[ ]:




