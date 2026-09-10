"""Check database persistence after Docker restart"""
from app.db import SessionLocal
from app import models

db = SessionLocal()
user = db.query(models.User).filter_by(phone_number="+919876500001").first()
if user:
    farmer = db.query(models.Farmer).filter_by(user_id=user.id).first()
    farm = db.query(models.Farm).filter_by(farmer_id=farmer.id).first() if farmer else None
    field = db.query(models.Field).filter_by(farmer_id=farmer.id).first() if farmer else None
    missing = "MISSING"
    print("=== PERSISTENCE TEST AFTER RESTART ===")
    print("User found: " + str(user.phone_number))
    print("Farmer: " + (farmer.display_name if farmer else missing))
    print("Farm: " + (farm.name if farm else missing))
    print("Field: " + (field.name if field else missing))
    if field:
        print("Area: " + str(field.area_m2) + " m2")
        print("Location: " + str(field.latitude) + ", " + str(field.longitude))
    print("PERSISTENCE: PASS")
else:
    print("User NOT found after restart - PERSISTENCE: FAIL")
db.close()
