// import axios from 'axios'

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000/api'
// const API_TIMEOUT = 10000 

// const apiClient = axios.create({
//   baseURL: API_BASE_URL,
//   timeout: API_TIMEOUT,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// })

// // Request interceptor - Add auth token to requests
// apiClient.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('jwtToken')
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`
//     }
//     return config
//   },
//   (error) => {
//     return Promise.reject(error)
//   }
// )

// // Response interceptor
// apiClient.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response) {
//       const { status, data } = error.response
      
//       switch (status) {
//         case 401:
//           localStorage.removeItem('jwtToken')
//           window.dispatchEvent(new Event('unauthorized')) 
//           break
//         case 403:
//           error.message = 'Access forbidden.'
//           break
//         case 404:
//           error.message = 'Resource not found.'
//           break
//         case 500:
//           error.message = 'Server error. Please try again later.'
//           break
//         default:
//           error.message = data?.message || 'An error occurred.'
//       }
//     } else if (error.request) {
//       error.message = 'Unable to reach server. Is backend running on port 5000?'
//     } else if (error.code === 'ECONNABORTED') {
//       error.message = 'Request timeout.'
//     }
    
//     return Promise.reject(error)
//   }
// )

// // API Methods
// // ... existing code

// export const paymentAPI = {
//   createPaymentIntent: async (roomId, nights) => {
//     const response = await apiClient.post('/payment/create-payment-intent', {
//       roomId,
//       nights
//     });
//     return response.data;
//   }
// };

// // ... existing exports


// export const authAPI = {
//   login: async (email, password) => {
//     const response = await apiClient.post('/auth/login', { email, password })
//     return response.data
//   },
  
//   signup: async (email, password, confirmPassword) => {
//     const response = await apiClient.post('/auth/signup', { 
//       email, 
//       password, 
//       confirmPassword 
//     })
//     return response.data
//   },
  
//   // FIX 2: Added Google Login
//   googleLogin: async (token) => {
//     const response = await apiClient.post('/auth/google', { token })
//     return response.data
//   },
  
//   logout: async () => {
//     localStorage.removeItem('jwtToken')
//     localStorage.removeItem('userName')
//   },
  
//   verifyToken: async () => {
//     const response = await apiClient.get('/users/profile')
//     return response.data
//   },

//   forgotPassword: async (email) => {
//     const response = await apiClient.post('/auth/forgotpassword', { email });
//     return response.data;
//   },

//   // 👇 ADD THIS: Set New Password
//   resetPassword: async (token, password) => {
//     const response = await apiClient.put(`/auth/resetpassword/${token}`, { password });
//     return response.data;
//   }
  
// }

// export const bookingAPI = {
//   create: async (bookingData) => {
//     const response = await apiClient.post('/bookings', bookingData)
//     return response.data
//   },
  
//   getById: async (bookingId) => {              
//     const response = await apiClient.get(`/bookings/${bookingId}`)
//     return response.data
//   },

//   getUserBookings: async () => {
//     const response = await apiClient.get('/bookings/mybookings')
//     return response.data
//   },
  
//   cancel: async (bookingId) => {
//     const response = await apiClient.delete(`/bookings/${bookingId}`)
//     return response.data
//   },
  
//   update: async (bookingId, updateData) => {
//     const response = await apiClient.patch(`/bookings/${bookingId}`, updateData)
//     return response.data
//   }
// }

// export const roomAPI = {
//   getAll: async (params = {}) => {
//     const response = await apiClient.get('/rooms', { params })
//     return response.data
//   },
  
//   getById: async (roomId) => {
//     const response = await apiClient.get(`/rooms/${roomId}`)
//     return response.data
//   },
  
//   checkAvailability: async (roomId, checkIn, checkOut) => {
//     const response = await apiClient.post('/rooms/check-availability', {
//       roomId,
//       checkIn,
//       checkOut
//     })
//     return response.data
//   }
// }

// export const supportAPI = {
//   sendMessage: async (name, email, message) => {
//     const response = await apiClient.post('/support/contact', {
//       name,
//       email,
//       message
//     })
//     return response.data
//   },
  
//   // FIX 3: Simplified Chatbot to match your backend
//   chatbot: async (message) => {
//     const response = await apiClient.post('/support/chatbot', {
//       message
//     })
//     return response.data
//   }
// }

// export const userAPI = {
//   getProfile: async () => {
//     const response = await apiClient.get('/users/profile')
//     return response.data
//   },
  
//   updateProfile: async (profileData) => {
//     const response = await apiClient.put('/users/profile', profileData)
//     return response.data
//   }
// }

// export const reviewAPI = {
//   getAll: async () => {
//     const response = await apiClient.get('/reviews')
//     return response.data
//   },
//   create: async (data) => {
//     const response = await apiClient.post('/reviews', data)
//     return response.data
//   }
// }


// export const adminAPI = {
//   getStats: async () => {
//     const response = await apiClient.get('/admin/stats');
//     return response.data;
//   },
//   getAllBookings: async () => {
//     const response = await apiClient.get('/admin/bookings');
//     return response.data;
//   }
// };

// export default apiClient





import axios from 'axios'

// 💡 ROBUST FALLBACK: If Vercel env is missing, default to Render in production, otherwise localhost.
const isProd = process.env.NODE_ENV === 'production' || 
               (typeof window !== 'undefined' && window.location.hostname !== 'localhost');

let API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_BASE_URL || API_BASE_URL.includes('localhost')) {
  API_BASE_URL = isProd ? 'https://smartstay-backend-ibsr.onrender.com/api' : 'http://localhost:5000/api';
}

const API_TIMEOUT = 60000; // Increased to 60s to account for Render free-tier cold starts

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

/* =========================
   REQUEST INTERCEPTOR
   ========================= */
apiClient.interceptors.request.use(
  (config) => {

    // 👑 Admin Token First Priority
    const adminToken = localStorage.getItem('adminToken')

    // 👤 Normal User Token
    const userToken = localStorage.getItem('jwtToken')

    // Use whichever exists
    const token = adminToken || userToken

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/* =========================
   RESPONSE INTERCEPTOR
   ========================= */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {

    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {

        case 401:
          // Remove BOTH tokens
          localStorage.removeItem('jwtToken')
          localStorage.removeItem('adminToken')

          window.dispatchEvent(new Event('unauthorized'))
          break

        case 403:
          error.message = 'Access forbidden.'
          break

        case 404:
          error.message = 'Resource not found.'
          break

        case 500:
          error.message = data?.message || 'Server error. Please try again later.'
          break

        default:
          error.message = data?.message || 'An error occurred.'
      }

    } else if (error.request) {
      error.message = 'Network Error: ' + (error.message || 'Unable to reach the backend server.');
    } else if (error.code === 'ECONNABORTED') {
      error.message = 'Request timeout.'
    }

    return Promise.reject(error)
  }
)

/* =========================
   AUTH API
   ========================= */
export const authAPI = {

  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password })
    return response.data
  },
  
  signup: async (name, email, password, isAdminSignup = false) => {
    const response = await apiClient.post('/auth/signup', { 
      name,
      email, 
      password,
      isAdminSignup // Pass flag to backend
    })
    return response.data
  },
  
  
  googleLogin: async (token) => {
    const response = await apiClient.post('/auth/google', { token })
    return response.data
  },
  
  logout: async () => {
    localStorage.removeItem('jwtToken')
    localStorage.removeItem('adminToken') // Ensure this is removed
    localStorage.removeItem('userName')
    localStorage.removeItem('isAdmin')
  },
  
  verifyToken: async () => {
    const response = await apiClient.get('/users/profile')
    return response.data
  },

  forgotPassword: async (email) => {
    const response = await apiClient.post('/auth/forgotpassword', { email })
    return response.data
  },

  resetPassword: async (token, password) => {
    const response = await apiClient.put(`/auth/resetpassword/${token}`, { password })
    return response.data
  }
}

/* =========================
   BOOKING API
   ========================= */
export const bookingAPI = {

  create: async (bookingData) => {
    const response = await apiClient.post('/bookings', bookingData)
    return response.data
  },

  // 👇 ADMIN: Create Booking Manually
  createAdminBooking: async (bookingData) => {
    const response = await apiClient.post('/bookings/manual-entry', bookingData);
    return response.data;
  },
  
  getById: async (bookingId) => {              
    const response = await apiClient.get(`/bookings/${bookingId}`)
    return response.data
  },

  getUserBookings: async () => {
    const response = await apiClient.get('/bookings/mybookings')
    return response.data
  },
  
  cancel: async (bookingId) => {
    const response = await apiClient.delete(`/bookings/${bookingId}`)
    return response.data
  },
  
  update: async (bookingId, updateData) => {
    const response = await apiClient.put(`/bookings/${bookingId}`, updateData)
    return response.data
  },

  // 👇 ADD THIS: Get Booked Dates
  getBookedDates: async (roomId) => {
    const response = await apiClient.get(`/bookings/availability/${roomId}`)
    return response.data
  }
}

/* =========================
   ROOM API
   ========================= */
export const roomAPI = {

  getAll: async (params = {}) => {
    const response = await apiClient.get('/rooms', { params })
    return response.data
  },
  
  getById: async (roomId) => {
    const response = await apiClient.get(`/rooms/${roomId}`)
    return response.data
  },
  
  checkAvailability: async (roomId, checkIn, checkOut) => {
    const response = await apiClient.post('/rooms/check-availability', {
      roomId,
      checkIn,
      checkOut
    })
    return response.data
  },

  // 👇 ADMIN: Create Room
  create: async (roomData) => {
    const response = await apiClient.post('/rooms', roomData);
    return response.data;
  },

  // 👇 ADMIN: Update Room
  update: async (roomId, roomData) => {
    const response = await apiClient.put(`/rooms/${roomId}`, roomData);
    return response.data;
  },

  // 👇 ADMIN: Delete Room
  delete: async (roomId) => {
    const response = await apiClient.delete(`/rooms/${roomId}`);
    return response.data;
  }
}

/* =========================
   SUPPORT API
   ========================= */
export const supportAPI = {

  sendMessage: async (name, email, message) => {
    const response = await apiClient.post('/support/contact', {
      name,
      email,
      message
    })
    return response.data
  },
  
  chatbot: async (message) => {
    const response = await apiClient.post('/support/chatbot', {
      message
    })
    return response.data
  }
}

/* =========================
   USER API
   ========================= */
export const userAPI = {

  getProfile: async () => {
    const response = await apiClient.get('/users/profile')
    return response.data
  },
  
  updateProfile: async (profileData) => {
    const response = await apiClient.put('/users/profile', profileData)
    return response.data
  }
}

/* =========================
   REVIEW API
   ========================= */
export const reviewAPI = {

  getAll: async () => {
    const response = await apiClient.get('/reviews')
    return response.data
  },

  create: async (data) => {
    const response = await apiClient.post('/reviews', data)
    return response.data
  }
}

/* =========================
   ADMIN API
   ========================= */
export const adminAPI = {

  getStats: async () => {
    const response = await apiClient.get('/admin/stats')
    return response.data
  },

  getAllBookings: async () => {
    const response = await apiClient.get('/admin/bookings')
    return response.data
  },

  adminChat: async (message) => {
    const response = await apiClient.post('/admin/chat', { message })
    return response.data
  }
}

/* =========================
   HALL API
   ========================= */
export const hallAPI = {
  getAll: async () => {
    const response = await apiClient.get('/halls')
    return response.data
  },
  getById: async (id) => {
    const response = await apiClient.get(`/halls/${id}`)
    return response.data
  },
  book: async (bookingData) => {
    const response = await apiClient.post('/halls/book', bookingData)
    return response.data
  },
  getMyBookings: async () => {
    const response = await apiClient.get('/halls/my-bookings')
    return response.data
  },
  // 👇 ADD THIS: Get Booked Dates for Event Halls
  getBookedDates: async (hallId) => {
    const response = await apiClient.get(`/halls/availability/${hallId}`)
    return response.data
  }
}

/* =========================
   PAYMENT API
   ========================= */
export const paymentAPI = {
  createPaymentIntent: async (roomId, nights) => {
    const response = await apiClient.post('/checkout/create-payment-intent', {
      roomId,
      nights
    })
    return response.data
  },
  createEventPaymentIntent: async (data) => {
    const response = await apiClient.post('/checkout/create-event-payment-intent', data)
    return response.data
  }
}

export default apiClient
