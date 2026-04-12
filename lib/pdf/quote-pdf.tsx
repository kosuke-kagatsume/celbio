import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

// Noto Sans JP（Google Fonts CDN）
Font.register({
  family: 'NotoSansJP',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-jp@5.0.1/files/noto-sans-jp-japanese-400-normal.woff', fontWeight: 400 },
    { src: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-jp@5.0.1/files/noto-sans-jp-japanese-700-normal.woff', fontWeight: 700 },
  ],
})

const s = StyleSheet.create({
  page: { fontFamily: 'NotoSansJP', fontSize: 9, padding: 40, color: '#333' },
  // ヘッダー
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: 700, textAlign: 'center', marginBottom: 4 },
  companyBlock: { width: 200 },
  companyName: { fontSize: 11, fontWeight: 700, marginBottom: 2 },
  companyInfo: { fontSize: 7, lineHeight: 1.5 },
  // 宛先
  toBlock: { marginBottom: 16 },
  toName: { fontSize: 13, fontWeight: 700, borderBottom: '1 solid #333', paddingBottom: 4, marginBottom: 4 },
  // メタ情報
  metaRow: { flexDirection: 'row', marginBottom: 2 },
  metaLabel: { width: 80, fontSize: 8, color: '#666' },
  metaValue: { fontSize: 8 },
  // 合計バー
  totalBar: { backgroundColor: '#f0f4ff', padding: 10, borderRadius: 4, marginVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 11, fontWeight: 700 },
  totalAmount: { fontSize: 16, fontWeight: 700 },
  // テーブル
  table: { marginTop: 8 },
  tableHead: { flexDirection: 'row', backgroundColor: '#e8ecf3', paddingVertical: 4, paddingHorizontal: 6, borderBottom: '1 solid #ccc' },
  tableRow: { flexDirection: 'row', paddingVertical: 3, paddingHorizontal: 6, borderBottom: '0.5 solid #eee' },
  colNo: { width: 24, textAlign: 'center' },
  colName: { flex: 1 },
  colSpec: { width: 100 },
  colQty: { width: 40, textAlign: 'right' },
  colUnit: { width: 30, textAlign: 'center' },
  colPrice: { width: 70, textAlign: 'right' },
  colSub: { width: 70, textAlign: 'right' },
  headText: { fontSize: 7, fontWeight: 700, color: '#555' },
  cellText: { fontSize: 8 },
  // サマリ
  summaryBlock: { marginTop: 12, alignItems: 'flex-end' },
  summaryRow: { flexDirection: 'row', marginBottom: 2, width: 200 },
  summaryLabel: { flex: 1, fontSize: 9, textAlign: 'right', paddingRight: 8 },
  summaryValue: { width: 80, fontSize: 9, textAlign: 'right', fontWeight: 700 },
  // 備考
  noteBlock: { marginTop: 16, borderTop: '0.5 solid #ddd', paddingTop: 8 },
  noteLabel: { fontSize: 8, fontWeight: 700, marginBottom: 2 },
  noteText: { fontSize: 8, lineHeight: 1.6 },
  // フッター
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, fontSize: 7, color: '#999', textAlign: 'center' },
})

export interface QuotePdfItem {
  itemName: string
  specification: string | null
  quantity: number
  unit: string | null
  unitPrice: number
  subtotal: number
}

export interface QuotePdfData {
  quoteNumber: string
  title: string | null
  createdAt: string
  desiredDate: string | null
  clientName: string
  projectNumber: string | null
  deliveryAddress: string | null
  note: string | null
  items: QuotePdfItem[]
  subtotalAmount: number
  taxAmount: number
  totalAmount: number
}

const fmtDate = (s: string) => {
  const d = new Date(s)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

const fmtYen = (n: number) => `¥${n.toLocaleString('ja-JP')}`

export function QuotePdfDocument({ data }: { data: QuotePdfData }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* タイトル */}
        <Text style={s.title}>御 見 積 書</Text>

        <View style={s.header}>
          {/* 宛先 */}
          <View style={{ flex: 1 }}>
            <View style={s.toBlock}>
              <Text style={s.toName}>{data.clientName} 様</Text>
              {data.projectNumber && (
                <View style={s.metaRow}>
                  <Text style={s.metaLabel}>案件番号</Text>
                  <Text style={s.metaValue}>{data.projectNumber}</Text>
                </View>
              )}
              <View style={s.metaRow}>
                <Text style={s.metaLabel}>見積番号</Text>
                <Text style={s.metaValue}>{data.quoteNumber}</Text>
              </View>
              <View style={s.metaRow}>
                <Text style={s.metaLabel}>見積日</Text>
                <Text style={s.metaValue}>{fmtDate(data.createdAt)}</Text>
              </View>
              {data.desiredDate && (
                <View style={s.metaRow}>
                  <Text style={s.metaLabel}>希望納期</Text>
                  <Text style={s.metaValue}>{fmtDate(data.desiredDate)}</Text>
                </View>
              )}
              {data.deliveryAddress && (
                <View style={s.metaRow}>
                  <Text style={s.metaLabel}>納品先</Text>
                  <Text style={s.metaValue}>{data.deliveryAddress}</Text>
                </View>
              )}
            </View>
          </View>

          {/* 発行元 */}
          <View style={s.companyBlock}>
            <Text style={s.companyName}>セリビオ株式会社</Text>
            <Text style={s.companyInfo}>
              {`〒000-0000 東京都○○区○○ 0-0-0\nTEL: 00-0000-0000\nFAX: 00-0000-0000`}
            </Text>
          </View>
        </View>

        {/* 合計バー */}
        <View style={s.totalBar}>
          <Text style={s.totalLabel}>合計金額（税込）</Text>
          <Text style={s.totalAmount}>{fmtYen(data.totalAmount)}</Text>
        </View>

        {/* タイトル（件名） */}
        {data.title && (
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 10, fontWeight: 700 }}>件名: {data.title}</Text>
          </View>
        )}

        {/* 明細テーブル */}
        <View style={s.table}>
          <View style={s.tableHead}>
            <Text style={[s.colNo, s.headText]}>No.</Text>
            <Text style={[s.colName, s.headText]}>品名</Text>
            <Text style={[s.colSpec, s.headText]}>仕様</Text>
            <Text style={[s.colQty, s.headText]}>数量</Text>
            <Text style={[s.colUnit, s.headText]}>単位</Text>
            <Text style={[s.colPrice, s.headText]}>単価</Text>
            <Text style={[s.colSub, s.headText]}>金額</Text>
          </View>
          {data.items.map((item, i) => (
            <View style={s.tableRow} key={i}>
              <Text style={[s.colNo, s.cellText]}>{i + 1}</Text>
              <Text style={[s.colName, s.cellText]}>{item.itemName}</Text>
              <Text style={[s.colSpec, s.cellText]}>{item.specification || ''}</Text>
              <Text style={[s.colQty, s.cellText]}>{item.quantity}</Text>
              <Text style={[s.colUnit, s.cellText]}>{item.unit || ''}</Text>
              <Text style={[s.colPrice, s.cellText]}>{fmtYen(item.unitPrice)}</Text>
              <Text style={[s.colSub, s.cellText]}>{fmtYen(item.subtotal)}</Text>
            </View>
          ))}
        </View>

        {/* サマリ */}
        <View style={s.summaryBlock}>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>小計</Text>
            <Text style={s.summaryValue}>{fmtYen(data.subtotalAmount)}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>消費税（10%）</Text>
            <Text style={s.summaryValue}>{fmtYen(data.taxAmount)}</Text>
          </View>
          <View style={[s.summaryRow, { borderTop: '1 solid #333', paddingTop: 4 }]}>
            <Text style={[s.summaryLabel, { fontWeight: 700, fontSize: 10 }]}>合計（税込）</Text>
            <Text style={[s.summaryValue, { fontSize: 10 }]}>{fmtYen(data.totalAmount)}</Text>
          </View>
        </View>

        {/* 備考 */}
        {data.note && (
          <View style={s.noteBlock}>
            <Text style={s.noteLabel}>備考</Text>
            <Text style={s.noteText}>{data.note}</Text>
          </View>
        )}

        {/* フッター */}
        <Text style={s.footer}>セリビオ株式会社</Text>
      </Page>
    </Document>
  )
}
