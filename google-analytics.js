/**
 * GoogeAnalyticsをインスタンス化するためのファクトリメソッド
 * @param { string } properties プロパティ名を指定
 * @param { array } dimensions ディメンションを指定
 * @param { array } metrics 指標を指定
 * @param { array } filters 絞り込み条件を指定
 * @param { array } orderCondition ソートの条件を指定
 * @param { string } startDate 期間の始点を「xxxx-xx-xx」形式で指定
 * @param { string } endDate 期間の終点を「xxxx-xx-xx」形式で指定
 * @return { GoogeAnalytics }
 */
function create(properties, dimensions, metrics, filters, orderCondition, startDate, endDate) {
  return new GoogeAnalytics(properties, dimensions, metrics, filters, orderCondition, startDate, endDate);
}

/**
 * ディメンションとして設定可能な項目のリストを取得するためのメソッド
 * @param { string } properties プロパティ名を指定
 * @return { array } usableDimentions ディメンションとして設定可能な項目リスト
 */
function getUsableDimentions(properties) {
  const dimentionMetadata = AnalyticsData.Properties.getMetadata(`properties/${properties}/metadata`).dimensions;
  const usableDimentions = dimentionMetadata.map((obj) => obj.apiName);
  return usableDimentions; 
}

/**
 * 指標として設定可能な項目のリストを取得するためのメソッド
 * @param { string } properties プロパティ名を指定
 * @return { array } usableMetrics 指標として設定可能な項目リスト
 */
function getUsableMetrics(properties) {
  const metricMetadata = AnalyticsData.Properties.getMetadata(`properties/${properties}/metadata`).metrics;
  const usableMetrics = metricMetadata.map((obj) => obj.apiName);
  return usableMetrics; 
}

(function(global){
  const GoogeAnalytics = (function() {
    function GoogeAnalytics(properties, dimensions, metrics, filters, orderCondition, startDate, endDate) {
      this.properties = properties;
      this.dimensions = dimensions;
      this.metrics = metrics;
      this.filters = filters;
      this.orderCondition = orderCondition;
      this.startDate = startDate; // yyyy-MM-ddで入力
      this.endDate = endDate; // yyyy-MM-ddで入力
      this.result = createReport(this.properties, this.dimensions, this.metrics, this.filters, this.orderCondition, this.startDate, this.endDate);
    }

    const createReport = (properties, dimensionArr, metricArr, filters, orderCondition, startDate, endDate) => {
      try {
        let request = AnalyticsData.newRunReportRequest();

        // Dimension： ディメンション
        dimensions = [];
        for (var x = 0; x < dimensionArr.length; x++) {
          let dimensionx = AnalyticsData.newDimension();
          dimensionx.name = dimensionArr[x];
          dimensions.push(dimensionx);
        }
        request.dimensions = dimensions;

        // Metric： 指標
        metrics = [];
        for (var x = 0; x < metricArr.length; x++) {
          let metricx = AnalyticsData.newMetric();
          metricx.name = metricArr[x];
          metrics.push(metricx);
        }
        request.metrics =metrics;

        // Filter: レポートのフィルタ
        if (filters.length > 0) {
          MATCH_TYPE = ['EXACT', 'BEGINS_WITH', 'ENDS_WITH', 'CONTAINS', 'FULL_REGEXP', 'PARTIAL_REGEXP'];
          OPERATION = ['EQUAL', 'LESS_THAN', 'LESS_THAN_OR_EQUAL', 'GREATER_THAN', 'GREATER_THAN_OR_EQUAL'];
          let metricFilter = AnalyticsData.newFilterExpression();
          metricFilter.andGroup = AnalyticsData.newFilterExpressionList();
          metricFilter.andGroup.expressions = [];
          let dimensionFilter = AnalyticsData.newFilterExpression();
          dimensionFilter.andGroup = AnalyticsData.newFilterExpressionList();
          dimensionFilter.andGroup.expressions = [];

          for (var x = 0; x < filters.length; x++) {
            for (var i = 0; i < filters[x].conditions.length; i++) {    
              if (MATCH_TYPE.includes(filters[x].matchType)) {
                let filterExpression = AnalyticsData.newFilterExpression();
                filterExpression.filter = AnalyticsData.newFilter();
                filterExpression.filter.fieldName = filters[x].fieldName;
                filterExpression.filter.stringFilter = AnalyticsData.newStringFilter();
                filterExpression.filter.stringFilter.value = filters[x].conditions[i];
                filterExpression.filter.stringFilter.matchType = filters[x].matchType;
                dimensionFilter.andGroup.expressions.push(filterExpression)
              }

              if (OPERATION.includes(filters[x].matchType)) {
                let filterExpression = AnalyticsData.newFilterExpression();
                filterExpression.filter = AnalyticsData.newFilter();
                filterExpression.filter.fieldName = filters[x].fieldName;
                filterExpression.filter.numericFilter = AnalyticsData.newNumericFilter();
                let numericValue = AnalyticsData.newNumericValue();
                numericValue.doubleValue = filters[x].conditions[i];
                filterExpression.filter.numericFilter.value = numericValue;
                filterExpression.filter.numericFilter.operation = filters[x].matchType;
                metricFilter.andGroup.expressions.push(filterExpression)
              }
            }
          }

          request.dimensionFilter = dimensionFilter;
          request.metricFilter = metricFilter;
        }

        // OrderBy: 並べ替え
        if (dimensionArr.includes(orderCondition[0])) {
          let dimensionOrderBy = AnalyticsData.newDimensionOrderBy();
          dimensionOrderBy.dimensionName = orderCondition[0];
          let orderby = AnalyticsData.newOrderBy();
          orderby.dimension = dimensionOrderBy;
          orderby.desc = (orderCondition[1] == 'desc') ? true : false;
          request.orderBys = [orderby];
        }
        if (metricArr.includes(orderCondition[0])) {
          let metricOrderBy = AnalyticsData.newMetricOrderBy();
          metricOrderBy.metricName = orderCondition[0];
          let orderby = AnalyticsData.newOrderBy();
          orderby.metric = metricOrderBy;
          orderby.desc = (orderCondition[1] == 'desc') ? true : false;
          request.orderBys = [orderby];
        }

        // 期間のフィルタリング
        let dateRange = AnalyticsData.newDateRange();
        dateRange.startDate = startDate;
        dateRange.endDate = endDate;
        request.dateRanges = dateRange;

        const report = AnalyticsData.Properties.runReport(request, `properties/${properties}`);
        if (!report.rows) {
          return [];
        }

        // ヘッダーの情報
        const dimensionHeaders = report.dimensionHeaders.map(
            (dimensionHeader) => {
              return dimensionHeader.name;
            });
        const metricHeaders = report.metricHeaders.map(
            (metricHeader) => {
              return metricHeader.name;
            });
        const headers = [];
        headers.push([...dimensionHeaders, ...metricHeaders]);

        // データの情報
        const rows = report.rows.map((row) => {
          const dimensionValues = row.dimensionValues.map(
              (dimensionValue) => {
                return dimensionValue.value;
              });
          const metricValues = row.metricValues.map(
              (metricValues) => {
                return metricValues.value;
              });
          return [...dimensionValues, ...metricValues];
        });

        return [...headers, ...rows];
      } catch (e) {
        Logger.log('Failed with error: %s', e);
      }
    }

    /**
    * クエリ結果を取得
    */
    GoogeAnalytics.prototype.getResult = function() {
      return this.result;
    };

    /**
    * クエリ結果のカラム名だけ取得
    */
    GoogeAnalytics.prototype.getHeader = function() {
      return this.result[0];
    };

    /**
    * クエリ結果のレコードだけ取得
    */
    GoogeAnalytics.prototype.getData = function() {
      return this.result.slice(1);
    };

    return GoogeAnalytics;
  })();
  global.GoogeAnalytics = GoogeAnalytics;
}) (this);