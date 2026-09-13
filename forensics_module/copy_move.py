import cv2
import numpy as np
from collections import Counter

def detect_copy_move(image, min_matches=15, distance_threshold=40, min_cluster_size=25):
    """
    Finds keypoints and matches the image against itself. Real copy-move forgery
    moves an entire patch by one consistent offset — so instead of just counting
    matches, we check whether many of them share the SAME displacement vector.
    Random repetitive textures (table lines, repeated letters) match in scattered
    directions with no consistent offset, and get filtered out here.
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    orb = cv2.ORB_create(nfeatures=2000)
    keypoints, descriptors = orb.detectAndCompute(gray, None)

    if descriptors is None or len(keypoints) < 10:
        return {"copy_move_detected": False, "match_count": 0}

    bf = cv2.BFMatcher(cv2.NORM_HAMMING)
    matches = bf.knnMatch(descriptors, descriptors, k=3)

    offsets = []
    for match_group in matches:
        for m in match_group[1:]:
            if m.distance < 40:
                pt1 = np.array(keypoints[m.queryIdx].pt)
                pt2 = np.array(keypoints[m.trainIdx].pt)
                spatial_distance = np.linalg.norm(pt1 - pt2)
                if spatial_distance > distance_threshold:
                    # Round the offset so near-identical shifts land in the same bucket
                    dx, dy = pt2 - pt1
                    offsets.append((round(dx / 5) * 5, round(dy / 5) * 5))

    if not offsets:
        return {"copy_move_detected": False, "match_count": 0}

    # Find the most common offset — a real copy-paste shows up as one dominant cluster
    offset_counts = Counter(offsets)
    most_common_offset, cluster_size = offset_counts.most_common(1)[0]

    return {
        "copy_move_detected": bool(cluster_size >= min_cluster_size),
        "match_count": len(offsets),
        "largest_consistent_cluster": cluster_size,
        "dominant_offset": most_common_offset,
    }