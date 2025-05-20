// app.js

document.addEventListener('DOMContentLoaded', () => {
    const showInfoBtn = document.getElementById('showInfoBtn');
    const contactBtn = document.getElementById('contactBtn');
    const closeModalBtn = document.getElementById('closeModal');
    const modal = document.getElementById('infoModal');

    // Open the modal when 'Learn More' or 'Get in Touch' button is clicked
    showInfoBtn.addEventListener('click', () => {
        modal.style.display = 'block';
    });

    contactBtn.addEventListener('click', () => {
        modal.style.display = 'block';
    });

    // Close the modal when the close button (X) is clicked
    closeModalBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Close the modal if the user clicks outside of it
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});
