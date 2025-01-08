useEffects:
    1. Deals with adding a Captcha to the page when the state of auth changes.
    2. Fetches users and saves the users in `users[]` state. Runs onSnapshot - which means it is proabably redundant inside a useEffect
    3. Fetches rosters and saves it in `rosters` state. Runs onSnapshot - which means it is proabably redundant inside a useEffect
    4. Fetches existing appointments and saves it in `appointments[]`. Runs onSnapshot - which means it is proabably redundant inside a useEffect
    - The above three can probably be condensed to server actions
    5. Sets the state `allowSubmit` to `True` or `False` depending on completion of fields.
    6. If user and user's phone number is given, the field 'telNo' is set to that in the state `AppDetails` otherwise the user is signed out
    7. Filter through the rosters in `rosters` to find the roster with the same UID as that in `appDetails`. Saves relevant rosters in state `tempRelevantRosters`.
    8. If the user changes their choice of barber or new appointments are fetched, change state `barberExistingApps`. This state stores the barber's exisiting appointments and saves it in the state (ln 229)
    9. Compares the fetched barber's existing appointments with the user's appointment time to check if intervals are overlapping (ln 241)
    10. Store the selection appointment time and day in `bookingTime` state
    11. 


- The sign up works by collecting the user's phone number and sending OTP to that as authentication.
    - Relevant functions are: 
        - `handleNumberChange`: sets the state for `setOtpSent`, `setVerified`, `setAppDetails`, `signUserOut`.
        - `handleSendOtp`: Uses `auth` and the captcha from first useEffect to authenticate user using FireBase
        - `handleOTPSubmit`: confirms the user's OTP 
- The form is saved inside the `appDetails` state.
    - `publishToAppointments`: takes the state `appDetails` and publishes it as a Doc to "appointments" collection in the db
    - the state that keeps track of whether the form has been submitted or not is `submited`
    - `handleSubmit`: calls the function `publishToAppointments(appDetails)` and sets the `submited` state to true
    - The form can only be submit if the state `allowSubmit` is set to `True`.
- The logic behind calendars and appointments:
    - Variables are set for `today`, `selectedDay`, `currentMonth`.
    - `changeSelectedDay`: sets the value for field "appDay" in the state `appDetails`and sets the state of `selectedDay`
    - 