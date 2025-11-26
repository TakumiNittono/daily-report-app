'use client'

import { useState } from 'react'
import DailyReportForm from './daily-report-form'
import TodoListByDate from './todo-list-by-date'

interface TodayTabProps {
  userId: string
}

export default function TodayTab({ userId }: TodayTabProps) {
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      {/* 今日の振り返りと明日の準備 */}
      <DailyReportForm userId={userId} date={today} />

      {/* 明日のToDoリスト */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-4">
          明日のToDoリスト
        </h2>
        <TodoListByDate 
          userId={userId} 
          targetDate={tomorrow}
          showStats={false}
          showFilter={true}
          showBulkActions={true}
        />
      </div>
    </div>
  )
}

