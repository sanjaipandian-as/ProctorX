import asyncio
import json
import math
import httpx

# Local FastAPI Endpoint
API_URL = "http://127.0.0.1:8001/api/ai/grade"

# A validation dataset of 15 teacher-graded answers for software engineering and database topics
VALIDATION_SET = [
    {
        "question": "What is the primary difference between a primary key and a unique key in SQL?",
        "student_answer": "A primary key cannot have null values and uniquely identifies a row. A unique key can have null values.",
        "expected_answer": "A primary key uniquely identifies a record in a table, is indexed automatically, and cannot contain NULL values (only one primary key per table). A unique key prevents duplicate values but can accept one or more NULL values depending on the DBMS (multiple unique keys allowed per table).",
        "max_marks": 5,
        "teacher_score": 5
    },
    {
        "question": "What is the primary difference between a primary key and a unique key in SQL?",
        "student_answer": "Both make sure data is unique. But primary key is only one per table.",
        "expected_answer": "A primary key uniquely identifies a record in a table, is indexed automatically, and cannot contain NULL values (only one primary key per table). A unique key prevents duplicate values but can accept one or more NULL values depending on the DBMS (multiple unique keys allowed per table).",
        "max_marks": 5,
        "teacher_score": 2
    },
    {
        "question": "Explain database normalization and its purpose.",
        "student_answer": "Normalization is used to organize database tables to reduce redundancy and prevent update anomalies.",
        "expected_answer": "Database normalization is the process of structuring a relational database in accordance with normal forms (1NF, 2NF, 3NF, etc.) to minimize data redundancy, improve data integrity, and prevent insert/update/delete anomalies.",
        "max_marks": 5,
        "teacher_score": 4
    },
    {
        "question": "Explain database normalization and its purpose.",
        "student_answer": "It speeds up select queries by duplicating columns in many places.",
        "expected_answer": "Database normalization is the process of structuring a relational database in accordance with normal forms (1NF, 2NF, 3NF, etc.) to minimize data redundancy, improve data integrity, and prevent insert/update/delete anomalies.",
        "max_marks": 5,
        "teacher_score": 0
    },
    {
        "question": "What is a deadlock in OS?",
        "student_answer": "Deadlock is when two processes are stuck waiting for each other to release resources, so neither can proceed.",
        "expected_answer": "A deadlock occurs in an operating system when two or more processes are unable to proceed because each is waiting for a resource held by another process in the set, creating a circular wait condition.",
        "max_marks": 5,
        "teacher_score": 5
    },
    {
        "question": "What is a deadlock in OS?",
        "student_answer": "A process crashes because it ran out of memory.",
        "expected_answer": "A deadlock occurs in an operating system when two or more processes are unable to proceed because each is waiting for a resource held by another process in the set, creating a circular wait condition.",
        "max_marks": 5,
        "teacher_score": 0
    },
    {
        "question": "Explain the MVC design pattern.",
        "student_answer": "MVC stands for Model View Controller. Model holds data, View is the UI, and Controller is the business logic linking them.",
        "expected_answer": "MVC is a software design pattern consisting of three interconnected parts: Model (manages data and rules), View (visual representation/UI), and Controller (accepts inputs and converts them to commands for Model/View). It separates concerns.",
        "max_marks": 5,
        "teacher_score": 5
    },
    {
        "question": "Explain the MVC design pattern.",
        "student_answer": "Model is DB, View is HTML, and Controller does nothing.",
        "expected_answer": "MVC is a software design pattern consisting of three interconnected parts: Model (manages data and rules), View (visual representation/UI), and Controller (accepts inputs and converts them to commands for Model/View). It separates concerns.",
        "max_marks": 5,
        "teacher_score": 2
    },
    {
        "question": "What is the difference between TCP and UDP?",
        "student_answer": "TCP is reliable and connection-oriented. UDP is fast, connectionless, but can lose packets.",
        "expected_answer": "TCP is a connection-oriented protocol that guarantees packet delivery, order, and error checking (reliable, slower). UDP is a connectionless protocol that sends packets without checking delivery or order (unreliable, faster, lightweight).",
        "max_marks": 5,
        "teacher_score": 5
    },
    {
        "question": "What is the difference between TCP and UDP?",
        "student_answer": "TCP is used for video streaming because it is fast.",
        "expected_answer": "TCP is a connection-oriented protocol that guarantees packet delivery, order, and error checking (reliable, slower). UDP is a connectionless protocol that sends packets without checking delivery or order (unreliable, faster, lightweight).",
        "max_marks": 5,
        "teacher_score": 1
    },
    {
        "question": "What is encapsulation in Object-Oriented Programming?",
        "student_answer": "Encapsulation is hiding the internal state of an object and only exposing operations through public methods.",
        "expected_answer": "Encapsulation is the bundling of data and methods that operate on that data into a single unit (class), restricting direct access to some of the object's components (information hiding using private/protected modifiers).",
        "max_marks": 5,
        "teacher_score": 5
    },
    {
        "question": "What is encapsulation in Object-Oriented Programming?",
        "student_answer": "It is when a class inherits fields from a parent class.",
        "expected_answer": "Encapsulation is the bundling of data and methods that operate on that data into a single unit (class), restricting direct access to some of the object's components (information hiding using private/protected modifiers).",
        "max_marks": 5,
        "teacher_score": 1
    },
    {
        "question": "What is a Foreign Key in databases?",
        "student_answer": "A foreign key is a field that references the primary key of another table to maintain referential integrity.",
        "expected_answer": "A foreign key is a column or group of columns in one table that uniquely identifies a row of another table (or the same table), enforcing a link between data in two tables to maintain referential integrity.",
        "max_marks": 5,
        "teacher_score": 5
    },
    {
        "question": "What is a Foreign Key in databases?",
        "student_answer": "It is a key imported from another database server across the network.",
        "expected_answer": "A foreign key is a column or group of columns in one table that uniquely identifies a row of another table (or the same table), enforcing a link between data in two tables to maintain referential integrity.",
        "max_marks": 5,
        "teacher_score": 0
    },
    {
        "question": "Explain REST API principles.",
        "student_answer": "REST APIs are stateless, client-server based, and use HTTP methods like GET, POST, PUT, and DELETE.",
        "expected_answer": "REST (Representational State Transfer) is an architectural style for APIs based on client-server separation, statelessness, cacheability, uniform interface (using standard HTTP verbs), and layered system architecture.",
        "max_marks": 5,
        "teacher_score": 4
    }
]

async def grade_sample(client: httpx.AsyncClient, sample: dict, idx: int):
    payload = {
        "questionText": sample["question"],
        "studentAnswer": sample["student_answer"],
        "expectedAnswer": sample["expected_answer"],
        "maxMarks": sample["max_marks"]
    }
    try:
        response = await client.post(API_URL, json=payload, headers={"Content-Type": "application/json"})
        response.raise_for_status()
        result = response.json()
        ai_score = int(result["score"])
        feedback = result["feedback"].replace("\n", " ")[:40] + "..."
        return {
            "index": idx + 1,
            "teacher_score": sample["teacher_score"],
            "ai_score": ai_score,
            "error": abs(sample["teacher_score"] - ai_score),
            "feedback": feedback,
            "success": True
        }
    except Exception as e:
        print(f"Error grading sample {idx+1}: {e}", flush=True)
        return {
            "index": idx + 1,
            "teacher_score": sample["teacher_score"],
            "ai_score": 0,
            "error": sample["teacher_score"],
            "feedback": f"Error: {e}",
            "success": False
        }

async def calibrate():
    print("Starting AI Grading Calibration (Concurrent Run)...", flush=True)
    print(f"Dataset Size: {len(VALIDATION_SET)} samples", flush=True)
    
    limits = httpx.Limits(max_keepalive_connections=5, max_connections=15)
    async with httpx.AsyncClient(timeout=120.0, limits=limits) as client:
        tasks = [grade_sample(client, sample, idx) for idx, sample in enumerate(VALIDATION_SET)]
        results = await asyncio.gather(*tasks)

    # Print Table
    print("\n" + "="*80, flush=True)
    print(f"{'Q#':<3} | {'Teacher Score':<13} | {'AI Score':<8} | {'Error':<5} | {'Feedback Summary'}", flush=True)
    print("="*80, flush=True)

    errors = []
    squared_errors = []
    exact_agreements = 0
    within_one_agreements = 0
    
    for r in sorted(results, key=lambda x: x["index"]):
        if not r["success"]:
            continue
        teacher_score = r["teacher_score"]
        ai_score = r["ai_score"]
        err = r["error"]
        feedback = r["feedback"]
        
        errors.append(err)
        squared_errors.append(err ** 2)
        if teacher_score == ai_score:
            exact_agreements += 1
        if err <= 1:
            within_one_agreements += 1
            
        print(f"{r['index']:<3} | {teacher_score:<13} | {ai_score:<8} | {err:<5} | {feedback}", flush=True)

    n = len(errors)
    if n == 0:
        print("\nCalibration failed. No samples graded.", flush=True)
        return
        
    mae = sum(errors) / n
    rmse = math.sqrt(sum(squared_errors) / n)
    exact_rate = (exact_agreements / n) * 100
    within_one_rate = (within_one_agreements / n) * 100
    
    print("="*80, flush=True)
    print("\nCALIBRATION METRICS", flush=True)
    print(f"Mean Absolute Error (MAE)      : {mae:.2f} marks (Target: <= 1.0)", flush=True)
    print(f"Root Mean Squared Error (RMSE)  : {rmse:.2f} marks", flush=True)
    print(f"Exact Agreement Rate            : {exact_rate:.1f}%", flush=True)
    print(f"Within +/- 1 Mark Agreement Rate: {within_one_rate:.1f}%", flush=True)
    print("="*80, flush=True)
    
if __name__ == "__main__":
    asyncio.run(calibrate())
