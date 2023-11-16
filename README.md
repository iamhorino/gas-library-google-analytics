## gas-library-google-analytics
- gas-library-google-analyticsはGoogleAppsScriptのライブラリです
- GA4のデータをGoogleSpreadSheetsに自動で反映したい場合などに使うことを想定しています
- UAの時にあったGoogleSpreadSheets連携アドオンのGA4バージョンがなかったため、アドオンの代替品として作成しました
  - ※GA4の公式アドオンが2023年8月中旬に出たようです
  - 詳しくは[こちら](https://workspace.google.com/marketplace/app/ga4_reports_builder_for_google_analytics/589269949355)を参照してください

#### 公式アドオンとの違い
1. 任意のディメンション、指標でソートすることができる
2. フィルタリングができる
3. 更新作業の完全自動化ができる

## Installation
スクリプトID: xxxxxx

## How to use
1. `gas-library-google-analytics`ライブラリを自分のプロジェクトにインポートします
2. 引数に取得したいデータの情報を入力しGoogleAnalyticsをインスタンス化します
3. `getResult`関数を使うと、GA4からデータを取得できます

```js
function myFunction() {
  const ga = GoogleAnalytics.create(
    'xxxxxxxxx', // GA4プロパティID
    ['date'], // dimentions
    ['sessions'], // metrics
    [], // filters
    ['date', 'asc'], // orderCondition
    '2023-10-01', // startDate
    '2023-10-03' // endDate
  );
  const result = ga.getResult();
}
```

## Example
```js
// GAS
function myFunction() {
  const ga = GoogleAnalytics.create(
    'xxxxxxxxx', // GA4プロパティ
    ['date'], // dimentions
    ['sessions'], // metrics
    [
      {'fieldName': 'firstUserSourceMedium', 'conditions': ['organic'], 'matchType': 'CONTAINS'},
      {'fieldName': 'landingPagePlusQueryString', 'conditions': ['/articles/[0-9]+'], 'matchType': 'FULL_REGEXP'}
    ], // dimensionFilters
    [
      {'fieldName': 'sessions', 'conditions': [50000], 'operation': 'GREATER_THAN'}
    ], // metricFilters
    ['sessions', 'desc'], // orderCondition
    '2023-10-01', // startDate
    '2023-10-02' // endDate
  );
  const result = ga.getResult();
  const header = ga.getHeader();
  const data = ga.getData();
}
```
```js
// Result
[
  ['date', 'sessions'],
  ['20231001', 50000],
  ['20231003', 48000],
  ['20231002', 42000]
],
[
  ['date', 'sessions']
],
[
  ['20231001', 50000],
  ['20231003', 48000],
  ['20231002', 42000]
]
```

## Document