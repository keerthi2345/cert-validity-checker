"""Synthetic test cases built from the four certificates' printed numbers (no images, no names)."""
from certificate_rules import verify

SSC_A = dict(marks=[99,99,100,99,100,99], grand_total=596, total_words="FIVE NINE SIX", roll_no="2138105078",
             subject_words=["NINE NINE","NINE NINE","ONE ZERO ZERO","NINE NINE","ONE ZERO ZERO","NINE NINE"])
SSC_B = dict(marks=[82,58,83,78,84,77], grand_total=462, total_words="FOUR SIX TWO", roll_no="2304106190",
             subject_words=["EIGHT TWO","FIVE EIGHT","EIGHT THREE","SEVEN EIGHT","EIGHT FOUR","SEVEN SEVEN"])
INTER = dict(year1=[(100,90),(100,99),(75,71),(75,70),(60,60),(60,55)],
             year2=[(100,90),(100,95),(75,68),(75,64),(60,60),(60,57),(30,30),(30,30)],
             grand_total=939, total_words="*NINE**THREE***NINE*", reg_no="2302210428")
SEM = dict(subjects=[("MICROPROCESSORS",3,"A",24),("DAA",3,"B+",21),("DBMS",3,"A",24),("FLAT",3,"B+",21),
                     ("MANAGERIAL ECON",3,"A",24),("ALGO LAB",1.5,"A+",13.5),("DBMS LAB",1.5,"O",15),
                     ("WEB TECH LAB",2,"O",20),("ETHICS",0,"B+",0)],
           total_credits=20.0, total_points=162.5, sgpa=8.13, register_no="323103210033")

for name, t, f in [("SSC A","ssc",SSC_A),("SSC B","ssc",SSC_B),("Inter","inter",INTER),("Semester","semester",SEM)]:
    r = verify(t, f); print(f"{name:9} -> {r['verdict']:12} {r['reason']}")
    assert r["verdict"] == "valid", r

# tampered: one subject mark changed, total left as printed
bad = dict(SSC_A, marks=[89,99,100,99,100,99])
r = verify("ssc", bad); print("Tampered  ->", r["verdict"], "|", r["reason"]); assert r["verdict"] == "suspicious"
# unreadable total: must be review, not tampering
r = verify("ssc", dict(SSC_A, grand_total=None)); print("Unreadable->", r["verdict"], "|", r["reason"]); assert r["verdict"] == "needs_review"
print("ALL TESTS PASSED")
