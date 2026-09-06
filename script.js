
/* =========================================================
   STUDY LIBRARY - JAVASCRIPT
========================================================= */


/* =========================================================
   1. MOBILE NAVIGATION
========================================================= */

const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav");

if (menuToggle && nav) {

    menuToggle.addEventListener("click", () => {

        nav.classList.toggle("mobile-active");

    });

}


/* Close mobile menu when a navigation link is clicked */

const navLinks = document.querySelectorAll(".nav-link");

navLinks.forEach((link) => {

    link.addEventListener("click", () => {

        nav.classList.remove("mobile-active");

    });

});


/* =========================================================
   2. SEAT DATA
========================================================= */

/*
    Temporary seat data.

    Later this data will come from the backend/database.
*/

const seats = {

    morning: {
        A01: "available",
        A02: "occupied",
        A03: "available",
        A04: "available",
        A05: "occupied",

        B01: "available",
        B02: "available",
        B03: "available",
        B04: "occupied",
        B05: "available",

        C01: "occupied",
        C02: "available",
        C03: "available",
        C04: "available",
        C05: "available"
    },

    evening: {
        A01: "occupied",
        A02: "available",
        A03: "available",
        A04: "occupied",
        A05: "available",

        B01: "available",
        B02: "occupied",
        B03: "available",
        B04: "available",
        B05: "occupied",

        C01: "available",
        C02: "available",
        C03: "occupied",
        C04: "available",
        C05: "available"
    },

    "full-day": {
        A01: "occupied",
        A02: "occupied",
        A03: "available",
        A04: "available",
        A05: "occupied",

        B01: "available",
        B02: "occupied",
        B03: "available",
        B04: "occupied",
        B05: "available",

        C01: "occupied",
        C02: "available",
        C03: "available",
        C04: "available",
        C05: "occupied"
    }

};


/* =========================================================
   3. SELECTORS
========================================================= */

const seatButtons = document.querySelectorAll(".seat");

const slotTabs = document.querySelectorAll(".slot-tab");

let selectedSlot = "morning";
let selectedSeat = null;


/* =========================================================
   4. UPDATE SEAT MAP
========================================================= */

function updateSeatMap(slot) {

    selectedSlot = slot;

    seatButtons.forEach((seatButton) => {

        const seatNumber = seatButton.textContent.trim();

        const seatStatus = seats[slot][seatNumber];

        /*
            Remove previous status classes
        */

        seatButton.classList.remove(
            "available",
            "occupied",
            "selected"
        );


        /*
            Add current status
        */

        if (seatStatus === "available") {

            seatButton.classList.add("available");

            seatButton.disabled = false;

        } else {

            seatButton.classList.add("occupied");

            seatButton.disabled = true;

        }

    });


    /*
        Reset selected seat
    */

    selectedSeat = null;

}


/* =========================================================
   5. SLOT TAB FUNCTIONALITY
========================================================= */

slotTabs.forEach((tab) => {

    tab.addEventListener("click", () => {

        /*
            Remove active class
        */

        slotTabs.forEach((item) => {

            item.classList.remove("active");

        });


        /*
            Add active class
        */

        tab.classList.add("active");


        /*
            Get selected slot
        */

        const slotName = tab.textContent
            .trim()
            .toLowerCase()
            .replace(" ", "-");


        /*
            Update seats
        */

        updateSeatMap(slotName);

    });

});


/* =========================================================
   6. SEAT SELECTION
========================================================= */

seatButtons.forEach((seatButton) => {

    seatButton.addEventListener("click", () => {

        /*
            Ignore occupied seats
        */

        if (seatButton.classList.contains("occupied")) {

            return;

        }


        /*
            Remove previous selection
        */

        seatButtons.forEach((seat) => {

            seat.classList.remove("selected");

        });


        /*
            Select clicked seat
        */

        seatButton.classList.add("selected");


        /*
            Save selected seat
        */

        selectedSeat = seatButton.textContent.trim();


        console.log(
            "Selected Seat:",
            selectedSeat
        );

        console.log(
            "Selected Slot:",
            selectedSlot
        );

    });

});


/* =========================================================
   7. BOOK SEAT BUTTON
========================================================= */

const bookSeatButtons = document.querySelectorAll(
    'a[href="seats.html"]'
);

bookSeatButtons.forEach((button) => {

    button.addEventListener("click", (event) => {

        /*
            Only apply this logic to buttons
            inside the seat section.
        */

        const seatSection = button.closest(".seat-section");

        if (!seatSection) {

            return;

        }


        /*
            Prevent navigation if no seat selected
        */

        if (!selectedSeat) {

            event.preventDefault();

            alert(
                "Please select an available seat first."
            );

            return;

        }


        /*
            Save booking information
            temporarily in localStorage.
        */

        localStorage.setItem(
            "selectedSeat",
            selectedSeat
        );

        localStorage.setItem(
            "selectedSlot",
            selectedSlot
        );

    });

});


/* =========================================================
   8. PLAN SELECTION
========================================================= */

const planButtons = document.querySelectorAll(
    ".plan-card .btn"
);

planButtons.forEach((button) => {

    button.addEventListener("click", () => {

        const planCard = button.closest(".plan-card");

        const planName = planCard
            .querySelector(".plan-name")
            .textContent
            .trim();

        localStorage.setItem(
            "selectedPlan",
            planName
        );

        console.log(
            "Selected Plan:",
            planName
        );

    });

});


/* =========================================================
   9. INITIALIZE SEAT MAP
========================================================= */

updateSeatMap("morning");


/* =========================================================
   10. CURRENT YEAR
========================================================= */

const currentYear = document.querySelector(
    ".footer-bottom p"
);

if (currentYear) {

    const year = new Date().getFullYear();

    currentYear.innerHTML =
        `© ${year} StudyHub. All rights reserved.`;

}