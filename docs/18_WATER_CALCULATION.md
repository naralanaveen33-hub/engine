# 18 — Water Calculation Engine

## Purpose
Convert a recommended crop root-zone water depth (mm) and field polygon area ($m^2$) into exact NET litres, GROSS application litres, and safe pump run duration without hardcoded guesses.

## Key Formulas

### 1. NET vs GROSS Water Volume
- **Net Water Volume:**
  $$1\text{ mm} \times 1\text{ m}^2 = 1.0\text{ Litre}$$
  $$\text{Net Water (Litres)} = \text{Net Depth (mm)} \times \text{Field Area (m}^2)$$
- **Application Efficiency Factors ($\eta$):**
  - **Drip:** $0.90$ ($90\%$ efficiency, $10\%$ loss)
  - **Sprinkler:** $0.75$ ($75\%$ efficiency)
  - **Furrow:** $0.60$ ($60\%$ efficiency)
  - **Flood:** $0.50$ ($50\%$ efficiency)
  - **Manual:** $0.80$ ($80\%$ efficiency)
- **Gross Water Application:**
  $$\text{Gross Water (Litres)} = \frac{\text{Net Water (Litres)}}{\text{Efficiency Factor}}$$

### 2. Calculated Duration vs Safe Execution Duration
- **Raw Calculated Duration:**
  $$\text{Calculated Duration (sec)} = \frac{\text{Gross Water (Litres)}}{\text{Flow Rate (L/min)}} \times 60.0$$
- **Safe Execution Duration:**
  $$\text{Safe Execution Duration} = \min(\text{Calculated Duration}, \text{Maximum Safety Limit})$$
- **Duration Statuses:**
  - `EXACT_CALCULATED`: Duration is within configured safety limit.
  - `DURATION_CAPPED_SAFETY`: Duration exceeded safety maximum (e.g. 7200s / 120 min cap) and was capped for actuator safety.
  - `FLOW_UNCALIBRATED`: Flow rate unavailable; conservative 15s fallback applied.

## Source Labeling
- Water estimate: `ESTIMATED`
- Actual flow sensor pulses: `REAL_SENSOR`
