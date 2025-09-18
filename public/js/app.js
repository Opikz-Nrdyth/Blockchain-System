// Check balance functionality
function checkBalance() {
  const address = document.getElementById("walletAddress").value;
  if (address) {
    fetch(`/balance/${address}`)
      .then((response) => response.json())
      .then((data) => {
        document.getElementById("balanceResult").innerHTML = `
                    <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                        Balance: ${data.balance} Coins
                    </div>
                `;
      })
      .catch((error) => {
        document.getElementById("balanceResult").innerHTML = `
                    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        Error checking balance
                    </div>
                `;
      });
  }
}

// Add copy to clipboard functionality for addresses
document.addEventListener("DOMContentLoaded", function () {
  const copyButtons = document.querySelectorAll(".copy-address");
  copyButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const address = this.getAttribute("data-address");
      navigator.clipboard.writeText(address).then(() => {
        this.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
          this.innerHTML = '<i class="fas fa-copy"></i>';
        }, 2000);
      });
    });
  });
});
