# 전체 로직

import numpy as np
import joblib
import os

fixed_cluster_ports = {
    0: "PHMNL",
    5: "VNHPH"
}

def predict_top_ports(hour, lat, lon, cog, heading):
    user_input = np.array([[lat, lon, cog, heading]])
    hour_key = str(hour)

    cluster_model = all_models[hour_key]['cluster_model']
    cluster_probs = cluster_model.predict_port(user_input)[0] # main.py
    cluster_labels = cluster_model.classes_

    top_2_idx = np.argsort(cluster_probs)[-2:][::-1]
    final_probs_joint = {}

    for i in top2_idx:
        prob_cluster = cluster_probs[i]
        cluster_id = cluster_labels[i]

        if cluster_id in fixed_cluster_ports:
            port = fixed_cluster_ports[cluster_id]
            final_probs_joint[port] = final_probs_joint.get(port, 0) + prob_cluster
            continue

        cluster_id_str = str(cluster_id)
        try:
            model = all_models[hour_key]['models'][cluster_id_str]
            encoder = all_models[hour_key]['encoders'][cluster_id_str]
        except:
            continue

        port_probs = model.predict_proba(user_input)[0]
        try:
            port_names = encoder.inverse_transform(np.arange(len(port_probs)))
        except:
            port_names = model.classes_

        top2_ports_idx = np.argsort(port_probs)[-2:][::-1]
        for j in top2_ports_idx:
            port = port_names[j]
            prob = port_probs[j]
            joint_prob = prob_cluster * prob
            final_probs_joint[port] = joint_prob

    if not final_probs_joint:
        return {"error": "예측된 항구 없음"}

    sorted_joint = sorted(final_probs_joint.items(), key=lambda x: x[1], reverse=True)[:3]
    return [{"port": port, "probability": round(prob, 4)} for port, prob in sorted_joint]





