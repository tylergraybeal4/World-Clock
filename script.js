const cities = {
  "New York": "America/New_York",
  "London": "Europe/London",
  "Tokyo": "Asia/Tokyo",
  "Sydney": "Australia/Sydney",
  "Dubai": "Asia/Dubai",
  "Moscow": "Europe/Moscow",
};

const timeZonesMapping = {
  EST: ["America/New_York", "America/Toronto"],
  PST: ["America/Los_Angeles", "America/Vancouver"],
  CST: ["America/Chicago"],
  MST: ["America/Denver"],
  GMT: ["Europe/London"],
};

const savedZones = new Map(); // Changed to Map for better key-value handling
let is24HourFormat = false;

function updateWorldClock() {
  const citiesDiv = document.getElementById('cities');
  if (!citiesDiv) return; // Guard clause for missing element

  citiesDiv.innerHTML = '';

  Object.entries(cities).forEach(([city, timeZone]) => {
    try {
      const cityTime = getCurrentTime(timeZone);
      const cityDiv = document.createElement('div');
      cityDiv.className = 'city';
      cityDiv.innerHTML = `<h3>${escapeHtml(city)}</h3><p>${escapeHtml(cityTime)}</p>`;
      citiesDiv.appendChild(cityDiv);
    } catch (error) {
      console.error(`Error displaying time for ${city}:`, error);
    }
  });

  populateSavedZones();
}

function populateSavedZones() {
  const savedDiv = document.getElementById('saved-zones');
  if (!savedDiv) return; // Guard clause for missing element

  savedDiv.innerHTML = '';

  savedZones.forEach((timeZone, label) => {
    try {
      const time = getCurrentTime(timeZone);
      const savedDivZone = document.createElement('div');
      savedDivZone.className = 'saved';
      savedDivZone.innerHTML = `<h3>${escapeHtml(label)}</h3><p>${escapeHtml(time)}</p>`;
      savedDiv.appendChild(savedDivZone);
    } catch (error) {
      console.error(`Error displaying saved zone ${label}:`, error);
    }
  });
}

function getCurrentTime(timeZone) {
  try {
    return new Date().toLocaleTimeString([], {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: !is24HourFormat,
    });
  } catch (error) {
    console.error(`Invalid timezone: ${timeZone}`);
    return 'Invalid timezone';
  }
}

function escapeHtml(unsafe) {
  return unsafe
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function convertTime() {
  const fromTz = document.getElementById('from-timezone')?.value;
  const toTz = document.getElementById('to-timezone')?.value;
  const time = document.getElementById('convert-time')?.value;
  const resultElement = document.getElementById('conversion-result');

  if (!fromTz || !toTz || !time || !resultElement) {
    alert('Please fill out all fields');
    return;
  }

  try {
    const [hours, minutes] = time.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new Error('Invalid time format');
    }

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    const options = {
      timeZone: toTz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: !is24HourFormat,
    };

    const convertedTime = date.toLocaleTimeString('en-US', options);
    resultElement.textContent = `Converted Time: ${convertedTime}`;
  } catch (error) {
    console.error('Time conversion error:', error);
    resultElement.textContent = 'Error converting time. Please check your inputs.';
  }
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function handleSearch(e) {
  const input = e.target.value.toLowerCase().trim();
  const resultBox = document.getElementById('search-results');
  if (!resultBox) return;

  resultBox.innerHTML = '';

  if (input) {
    try {
      const filteredZones = Intl.supportedValuesOf('timeZone').filter((tz) =>
        tz.toLowerCase().includes(input)
      );

      const relatedZones = timeZonesMapping[input.toUpperCase()] || [];
      const combinedZones = [...new Set([...filteredZones, ...relatedZones])].slice(0, 10); // Limit results

      combinedZones.forEach((timezone) => {
        const cityName = timezone.split('/').pop().replace(/_/g, ' ');
        const div = document.createElement('div');
        div.className = 'search-result';
        div.textContent = cityName;
        div.addEventListener('click', () => addSavedZone(cityName, timezone));
        resultBox.appendChild(div);
      });
    } catch (error) {
      console.error('Search error:', error);
    }
  }
}

function addSavedZone(cityName, timezone) {
  if (!cityName || !timezone) return;
  
  try {
    // Verify timezone is valid before adding
    new Date().toLocaleString('en-US', { timeZone: timezone });
    savedZones.set(cityName, timezone);
    populateSavedZones();
    clearSearch();
  } catch (error) {
    console.error('Invalid timezone:', error);
    alert('Invalid timezone selected');
  }
}

function clearSearch() {
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  
  if (searchInput) searchInput.value = '';
  if (searchResults) searchResults.innerHTML = '';
}

function setupEventListeners() {
  const convertBtn = document.getElementById('convert-btn');
  const searchInput = document.getElementById('search-input');
  const toggleFormat = document.getElementById('toggle-format');

  if (convertBtn) {
    convertBtn.addEventListener('click', convertTime);
  }

  if (searchInput) {
    searchInput.addEventListener('input', debounce(handleSearch, 300));
  }

  if (toggleFormat) {
    toggleFormat.addEventListener('click', () => {
      is24HourFormat = !is24HourFormat;
      toggleFormat.textContent = is24HourFormat
        ? 'Switch to 12-Hour Format'
        : 'Switch to 24-Hour Format';
      updateWorldClock();
    });
  }

  // Set up timezone converter datalists
  setupConverterDatalist('from-timezone', 'from-timezone-list');
  setupConverterDatalist('to-timezone', 'to-timezone-list');
}

function setupConverterDatalist(inputId, dataListId) {
  const input = document.getElementById(inputId);
  const dataList = document.getElementById(dataListId);
  
  if (!input || !dataList) return;

  input.addEventListener('input', debounce((e) => {
    const value = e.target.value.toLowerCase().trim();
    dataList.innerHTML = '';

    if (value) {
      try {
        const filteredZones = Intl.supportedValuesOf('timeZone').filter((tz) =>
          tz.toLowerCase().includes(value)
        );

        const relatedZones = timeZonesMapping[value.toUpperCase()] || [];
        const combinedZones = [...new Set([...filteredZones, ...relatedZones])].slice(0, 10);

        combinedZones.forEach((timezone) => {
          const option = document.createElement('option');
          option.value = timezone;
          dataList.appendChild(option);
        });
      } catch (error) {
        console.error('Error populating datalist:', error);
      }
    }
  }, 300));
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  updateWorldClock();
  setInterval(updateWorldClock, 1000);
});