import React from 'react'
import { Download } from 'lucide-react'
import { Button } from './Button'

interface ExportButtonProps {
  data: any[]
  filename?: string
  label?: string
}

const ExportButton: React.FC<ExportButtonProps> = ({ 
  data, 
  filename = 'export', 
  label = 'Exportar' 
}) => {
  const handleExport = () => {
    if (!data || data.length === 0) {
      alert('Sem dados para exportar')
      return
    }

    try {
      const headers = Object.keys(data[0])
      const csvRows = [
        headers.join(','),
        ...data.map(row => 
          headers.map(fieldName => {
            const val = row[fieldName] || ''
            const stringVal = typeof val === 'object' ? JSON.stringify(val) : String(val)
            return `"${stringVal.replace(/"/g, '""')}"`
          }).join(',')
        )
      ]
      
      const csvContent = csvRows.join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Erro ao exportar CSV:', error)
      alert('Erro ao gerar arquivo de exportação')
    }
  }

  return (
    <Button
      variant="secondary"
      size="md"
      onClick={handleExport}
      title="Exportar para CSV"
      className="flex items-center gap-2"
    >
      <Download size={14} className="text-ink-faint" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  )
}

export default ExportButton

