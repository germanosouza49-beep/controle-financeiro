import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export const geminiFlash = genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL_FAST || 'gemini-2.0-flash',
})

export const geminiPro = genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL_PRO || 'gemini-2.5-pro',
})
