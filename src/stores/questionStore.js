import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useQuestionStore = defineStore('question', () => {
  // 狀態
  const currentQuestions = ref([])
  const preTestQuestions = ref([]) // 前測題目
  const postTestQuestions = ref([]) // 後測題目
  const selectedRules = ref([]) // 選中的關聯規則
  const selectedGrade = ref('')
  const selectedSubject = ref('')
  const associationRules = ref('')
  const questionTypes = ref([])
  const questionCount = ref(5)
  const uploadedFile = ref(null)
  const extractedText = ref('')
  const isLoading = ref(false)
  const isProcessingFile = ref(false)
  const isGenerating = ref(false)
  const studentAnswers = ref([]) // 學生作答記錄

  // 年段選項
  const gradeOptions = [
    { value: '1', label: '國小一年級' },
    { value: '2', label: '國小二年級' },
    { value: '3', label: '國小三年級' },
    { value: '4', label: '國小四年級' },
    { value: '5', label: '國小五年級' },
    { value: '6', label: '國小六年級' }
  ]

  // 科目選項 - 只顯示國文
  const subjectOptions = [
    { value: 'chinese', label: '國文' }
  ]

  // 國文題型選項
  const chineseQuestionTypes = {
    single: [
      { value: 'pronunciation', label: '字音字形辨別' },
      { value: 'vocabulary', label: '詞語情境應用克漏字' },
      { value: 'idiom', label: '成語情境應用' },
      { value: 'sentence', label: '句意分析與重組' },
      { value: 'rhetoric', label: '國學常識與修辭' },
      { value: 'reading', label: '文意推論與摘要選擇題' }
    ],
    group: []
  }

  // 英文題型選項
  const englishQuestionTypes = {
    single: [
      { value: 'grammar', label: '文法句型' },
      { value: 'cloze', label: '閱讀填空' },
      { value: 'comprehension', label: '閱讀理解' }
    ],
    group: []
  }

  // 計算屬性
  const availableQuestionTypes = computed(() => {
    if (selectedSubject.value === 'chinese') {
      return chineseQuestionTypes
    } else if (selectedSubject.value === 'english') {
      return englishQuestionTypes
    }
    return { single: [], group: [] }
  })

  // 動作
  const setGrade = (grade) => {
    selectedGrade.value = grade
  }

  const setSubject = (subject) => {
    selectedSubject.value = subject
    questionTypes.value = [] // 重置題型選擇
  }

  const setAssociationRules = (rules) => {
    associationRules.value = rules
  }

  const setQuestionTypes = (types) => {
    questionTypes.value = types
  }

  const setQuestionCount = (count) => {
    questionCount.value = count
  }

  const setUploadedFile = (file) => {
    uploadedFile.value = file
  }

  const setExtractedText = (text) => {
    extractedText.value = text
  }

  const setCurrentQuestions = (questions) => {
    currentQuestions.value = questions
  }
  
  const setPreTestQuestions = (questions) => {
    preTestQuestions.value = questions
  }
  
  const setPostTestQuestions = (questions) => {
    postTestQuestions.value = questions
  }
  
  const setSelectedRules = (rules) => {
    selectedRules.value = rules
  }

  const setLoading = (loading) => {
    isLoading.value = loading
  }

  const setProcessingFile = (processing) => {
    isProcessingFile.value = processing
  }

  const setGeneratingStatus = (generating) => {
    isGenerating.value = generating
  }
  
  const setStudentAnswers = (answers) => {
    studentAnswers.value = answers
  }
  
  const addStudentAnswer = (answer) => {
    studentAnswers.value.push(answer)
  }

  const resetForm = () => {
    selectedGrade.value = ''
    selectedSubject.value = 'chinese' // 保持科目為中文
    associationRules.value = ''
    selectedRules.value = [] // 清除選中的規則
    questionTypes.value = []
    questionCount.value = 5
    uploadedFile.value = null
    extractedText.value = ''
  }

  return {
    // 狀態
    currentQuestions,
    preTestQuestions,
    postTestQuestions,
    selectedRules,
    selectedGrade,
    selectedSubject,
    associationRules,
    questionTypes,
    questionCount,
    uploadedFile,
    extractedText,
    isLoading,
    isProcessingFile,
    isGenerating,
    studentAnswers,
    
    // 選項
    gradeOptions,
    subjectOptions,
    availableQuestionTypes,
    
    // 動作
    setGrade,
    setSubject,
    setAssociationRules,
    setQuestionTypes,
    setQuestionCount,
    setUploadedFile,
    setExtractedText,
    setCurrentQuestions,
    setPreTestQuestions,
    setPostTestQuestions,
    setSelectedRules,
    setLoading,
    setProcessingFile,
    setGeneratingStatus,
    setStudentAnswers,
    addStudentAnswer,
    resetForm
  }
})