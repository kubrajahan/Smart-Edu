# Security Specification

## 1. Data Invariants
- A student record must have a unique identifier, an associated grade, and a parent's email.
- Timetable entries must possess valid weekday properties and cannot conflict in timeslots for the same instructor.
- A user cannot modify another student's fee details unless they are signed in as an institutional worker.

## 2. Invalidation & "Dirty Dozen" Threat Payloads
Here are twelve payloads designed to bypass schema protection and relational gates:
1. **Unauthenticated Student Update**: Write to `/students/std-1` without auth.
2. **Identity Spoofing**: Attempt to overwrite student parent email with a different email.
3. **Ghost Fields Injection**: Sending "isVerified: true" during student updates.
4. **Invalid Timetable Input**: Setting timetable weekday to "Funday".
5. **Double Booking Teacher**: Overlapping slot on Wednesday mornings.
6. **Room Poisoning**: Room identifier representing more than 128 characters.
7. **Negative copies**: Registering libraryBook copy count of `-5`.
8. **Malicious ID insertion**: Setting document ID of length `1000` with non-ASCII characters.
9. **Zero Value Fees Total**: Modifying due balance to negative values.
10. **Admin Privilege Spoofing**: Registering custom claims to grant auto-admins.
11. **Orphaned Grades Entry**: Modifying academic scores for a non-existent student.
12. **PII Blanket Leak**: Querying private email arrays without self-authorization attributes.

## 3. Test Schema Mock Design
Rules are structured inside `/firestore.rules` where standard verification models must enforce structural validation.
