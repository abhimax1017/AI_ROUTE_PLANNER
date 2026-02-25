from flask import Flask, render_template, request, jsonify
# from flask_cors import CORS # Removed dependency to prevent ModuleNotFoundError
from itertools import permutations
import os

# Use absolute path for templates to avoid TemplateNotFound errors
template_dir = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__, template_folder=template_dir)

# Manual CORS implementation to avoid extra dependencies
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# CORS(app) # Removed init

# Sample distance data (KM)
DISTANCES = {
    "Hyderabad": {"Bangalore": 570, "Chennai": 630, "Mumbai": 710},
    "Bangalore": {"Hyderabad": 570, "Chennai": 350, "Mumbai": 980},
    "Chennai": {"Hyderabad": 630, "Bangalore": 350, "Mumbai": 1030},
    "Mumbai": {"Hyderabad": 710, "Bangalore": 980, "Chennai": 1030},
}

# ---------------- AGENTS ---------------- #

class RouteAgent:
    def generate_routes(self, cities):
        if not cities or len(cities) < 2:
            return [tuple(cities)]
        return list(permutations(cities))

class CostAgent:
    def calculate_distance(self, route):
        total_dist = 0.0
        for i in range(len(route) - 1):
            city_a = route[i]
            city_b = route[i + 1]
            # Use float for distance throughout
            dist = float(DISTANCES.get(city_a, {}).get(city_b, 1000.0))
            total_dist += dist
        return total_dist

class SafetyAgent:
    def get_hazard_risk(self, route):
        risk_multiplier = 1.0
        if "Mumbai" in route:
            # Simulate high-risk weather in coastal Mumbai
            risk_multiplier += 0.5
        return float(risk_multiplier)

class FuelOptimizerAgent:
    def __init__(self):
        # Current average rates in India (₹ per unit)
        self.rates = {
            "petrol": 104.2, 
            "diesel": 92.4, 
            "cng": 89.5, 
            "ev": 0.15 
        }
    
    def calculate_usage(self, distance):
        dist_km = float(distance)
        # Consumption patterns (Units per 100km)
        consumption = {
            "petrol": 8.0, 
            "diesel": 6.5, 
            "cng": 5.0,    
            "ev": 15.0     
        }
        
        usage = {fuel: (dist_km / 100.0) * rate for fuel, rate in consumption.items()}
        costs = {fuel: float(usage[fuel] * self.rates[fuel]) for fuel in usage}
        
        return {
            "usage": usage,
            "costs": costs,
            "rates": self.rates
        }

class CoordinatorAgent:
    def find_best_route(self, routes, active_agents):
        cost_agent = CostAgent()
        safety_agent = SafetyAgent()
        fuel_agent = FuelOptimizerAgent()
        
        best_route = None
        min_score = float('inf')
        best_metrics = {}

        for route in routes:
            distance = cost_agent.calculate_distance(route)
            score = float(distance)
            
            # Apply Safety Multiplier if agent is active
            if "safety" in active_agents:
                risk = safety_agent.get_hazard_risk(route)
                score *= risk
                
            if score < min_score:
                min_score = float(score)
                best_route = route
                best_metrics = fuel_agent.calculate_usage(distance)

        return best_route, min_score, best_metrics

# ---------------- ROUTES ---------------- #

@app.route("/")
def home():
    try:
        return render_template("index.html")
    except Exception as e:
        return f"Error: Template not found at {template_dir}. Details: {str(e)}", 404

@app.route("/optimize", methods=["POST"])
def optimize():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data received"}), 400
            
        cities = [c.strip() for c in data.get("cities", ["Hyderabad", "Bangalore"])]
        active_agents = data.get("agents", [])

        route_agent = RouteAgent()
        coordinator = CoordinatorAgent()

        routes = route_agent.generate_routes(cities)
        best_route, score, fuel_usage = coordinator.find_best_route(routes, active_agents)

        return jsonify({
            "route": [x for x in best_route] if best_route else [],
            "score": float(score),
            "distance": float(score),
            "fuel_usage": fuel_usage
        })
    except Exception as e:
        print(f"Optimization Error: {e}")
        return jsonify({"error": str(e)}), 500

# ---------------- RUN ---------------- #

if __name__ == "__main__":
    print(f"Starting MAS Backend. Template Directory: {template_dir}")
    app.run(host='0.0.0.0', port=5000, debug=True)
