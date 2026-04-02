# UrbanFit Member Engagement Dashboard  
### Interactive Visualization with D3.js  

---

## Project Information

**Developed by:**  
Ruah George  
Razeen Bin Parvez  
Charvvy Kwatra  

**Course:** BBUS 4105 – Presenting Data  
**Professor:** Preety Wadhwa  
**Date:** March 31, 2026  

---

## Overview

This project is an interactive data visualization dashboard built using D3.js for UrbanFit, a network of fitness clubs. The dashboard is designed to analyze member behavior, movement patterns between club locations, and class participation trends over time.

The goal of this project is to transform raw data into meaningful insights that support data-driven decision making in operations, marketing, and customer engagement.

---

## Business Questions

The dashboard is designed to answer three key business questions:

1. Which UrbanFit locations act as major movement hubs?
2. How do member characteristics differ across customer segments?
3. How do class participation trends change over time?

---

## Visualizations

### 1. Member Movement Map
- Displays movement flows between club locations  
- Line thickness represents flow volume  
- Identifies key hubs and high-traffic routes  

### 2. Parallel Coordinates Plot
- Compares multiple member attributes:
  - Age  
  - Monthly Fee  
  - Check-ins  
  - App Usage  
  - Unique Clubs  
  - Total Sales  
- Colored by membership tier  

### 3. Streamgraph
- Shows class participation trends over time  
- Displays top fitness class categories  
- Highlights shifting member preferences  

---

## Interactivity Features

- Dynamic filters:
  - Flow Month  
  - Membership Tier  
  - Home Club  
- Real-time updates across all visualizations  
- Tooltips with detailed metrics  
- Hover highlighting for better data exploration  
- Reset functionality for quick navigation  

---

## Key Insights

- **Movement Concentration:**  
  Movement across clubs is concentrated in a few key locations, with certain clubs acting as central hubs. This supports better operational planning and staffing decisions.

- **Member Value is Multi-Dimensional:**  
  High-value members are defined by a combination of behaviors such as spending, app usage, and club visits — not just check-ins alone.

- **Dynamic Class Demand:**  
  Class participation trends change over time, with Spin consistently leading overall participation while other classes fluctuate.

- **Business Impact:**  
  These insights enable UrbanFit to optimize marketing strategies, improve resource allocation, and adjust class offerings based on real demand patterns.

---

## Technologies Used

- D3.js (Data Visualization)  
- HTML, CSS, JavaScript  
- GitHub Pages (Deployment)  

---

## Project Structure
```
urbanfit-dashboard/
├── index.html
├── script.js
├── style.css
└── data/
    ├── class_streamgraph.csv
    ├── club_flows_with_coordinates.csv
    └── member_metrics.csv
```

---

## How to Run Locally

1. Open the project folder in Visual Studio Code  
2. Use Live Server to run `index.html`  
3. Ensure the `data` folder is correctly placed  

---

## Live Demo

https://ruah-jg.github.io/urbanfit-dashboard/ 

---

## Challenges

- Ensuring proper CSV loading using a local server environment  
- Managing visual clutter in complex charts  
- Maintaining consistency in design across multiple visualizations  

---

## Conclusion

This project demonstrates how interactive dashboards can effectively transform raw data into actionable insights. By combining clear visualizations with user-friendly interactivity, the UrbanFit dashboard provides a powerful tool for understanding member behavior and supporting strategic decision-making.

---

## References

- Bostock, M. (2026). D3.js - Data-Driven Documents  
- Few, S. (2013). Information Dashboard Design  
- Knaflic, C. N. (2015). Storytelling with Data  

---
