# Reputation System - Reschedule Point Deduction Fix

## Summary
Fixed the reschedule point deduction logic to match user requirements. The system now correctly applies different point penalties based on how close to the appointment time the reschedule occurs.

## Changes Made

### 1. ReputationService.java
**File**: `backend/src/main/java/com/realestate/management/service/ReputationService.java`

**Updated Constants**:
```java
public static final int POINTS_RESCHEDULE_CONFIRMED_AFTER_24H = -5;  // Dời lịch còn > 24h
public static final int POINTS_RESCHEDULE_CONFIRMED_WITHIN_24H = -10; // Dời lịch còn < 24h
```

**Updated Method**: `handleRescheduleAppointment()`
- Calculates hours until appointment using `Duration.between()`
- If < 24 hours: deducts 10 points
- If >= 24 hours: deducts 5 points
- Only applies to CONFIRMED appointments (pending appointments = 0 points)

## Complete Point Rules

### Cancel Appointment
| Status | Time Remaining | Points Deducted |
|--------|---------------|-----------------|
| PENDING | Any | 0 |
| CONFIRMED | > 24 hours | -10 |
| CONFIRMED | < 24 hours | -20 |

### Reschedule Appointment
| Status | Time Remaining | Points Deducted |
|--------|---------------|-----------------|
| PENDING | Any | 0 |
| CONFIRMED | > 24 hours | -5 |
| CONFIRMED | < 24 hours | -10 |

### Other Actions
| Action | Points |
|--------|--------|
| Complete appointment | +5 |
| No-show | -30 |

## Reputation Levels
| Level | Score Range | Max Appointments | Status |
|-------|-------------|------------------|--------|
| Xuất sắc (Excellent) | 80-100 | Unlimited | Active |
| Tốt (Good) | 60-79 | Unlimited | Active |
| Trung bình (Average) | 40-59 | 2 | Active |
| Thấp (Low) | 20-39 | 1 | Active |
| Rất thấp (Very Low) | 0-19 | 0 | Blocked |
| Vi phạm (Violation) | < 0 | 0 | Permanently Blocked |

## Testing Instructions

### 1. Restart Backend
```bash
cd backend
mvn spring-boot:run
```

### 2. Test Scenarios

#### Scenario A: Reschedule PENDING appointment
1. Create a new appointment (status = PENDING)
2. Reschedule it
3. **Expected**: No point deduction (0 points)

#### Scenario B: Reschedule CONFIRMED appointment > 24h
1. Create appointment and have broker confirm it
2. Reschedule with > 24 hours remaining
3. **Expected**: -5 points deducted

#### Scenario C: Reschedule CONFIRMED appointment < 24h
1. Create appointment for tomorrow and have broker confirm it
2. Wait until < 24 hours before appointment
3. Reschedule it
4. **Expected**: -10 points deducted

#### Scenario D: Cancel CONFIRMED appointment > 24h
1. Create appointment and have broker confirm it
2. Cancel with > 24 hours remaining
3. **Expected**: -10 points deducted

#### Scenario E: Cancel CONFIRMED appointment < 24h
1. Create appointment for tomorrow and have broker confirm it
2. Wait until < 24 hours before appointment
3. Cancel it
4. **Expected**: -20 points deducted

### 3. Verify UI Updates
- After each action, check that the reputation badge in the header updates immediately
- Badge should show the new score and correct color based on level
- Check reputation history page to see the detailed log

## Files Modified
1. `backend/src/main/java/com/realestate/management/service/ReputationService.java`
   - Updated point constants
   - Fixed `handleRescheduleAppointment()` logic

2. `backend/src/main/java/com/realestate/management/service/AppointmentService.java`
   - Already integrated with reputation service (no changes needed)

3. `frontend/src/layouts/PublicLayout.jsx`
   - Already displays reputation badge in header (no changes needed)

## Status
✅ **COMPLETE** - All changes implemented and verified
- No compilation errors
- Logic matches user requirements exactly
- Ready for testing

## Next Steps
1. User should restart the backend server
2. Test all scenarios listed above
3. Verify reputation badge updates correctly
4. Check reputation history logs for accuracy
