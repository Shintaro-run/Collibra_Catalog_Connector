'use client';

import { createContext, createElement, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

export type Lang = 'en' | 'ja';

const STRINGS = {
  en: {
    appName: 'Collibra Catalog Connector',
    tagline: 'R&D Data Catalog',
    nav: {
      search: 'Search assets, terms…',
      settings: 'Settings',
      toggleTheme: 'Toggle theme',
      backToMap: 'Back to anatomical map',
      backTo: 'Back to',
    },
    home: {
      kicker: 'Discover by anatomy',
      headline: 'Find the data behind every therapeutic area, from a single anatomical view.',
      lede: 'Click any region of the body to see which therapeutic areas hold data there. Cross-system programmes such as Oncology and Pharmacovigilance light up multiple regions at once with connecting paths.',
      stats: {
        therapeuticAreas: 'Therapeutic areas',
        catalogued: 'Catalogued assets',
        avgQuality: 'Avg. quality',
        lastRefresh: 'Last refresh',
      },
      panels: {
        therapeuticAreas: 'Therapeutic areas',
        crossSystem: 'Cross-system',
      },
    },
    domain: {
      domainType: 'Domain type',
      community: 'Community',
      steward: 'Steward',
      technicalSteward: 'Technical steward',
      anatomy: 'Anatomy',
      assets: 'Assets',
      assetCount: 'Assets',
      totalRows: 'Total rows',
      certified: 'Certified',
      sourceSystems: 'Source systems',
      commonTags: 'Common tags',
      avgQuality: 'Avg. quality',
    },
    asset: {
      schema: 'Schema',
      qualityBreakdown: 'Quality breakdown',
      completeness: 'Completeness',
      freshness: 'Freshness',
      validity: 'Validity',
      lineage: 'Lineage',
      regulatoryScope: 'Regulatory scope',
      tags: 'Tags',
      upstreamLineage: 'Upstream lineage',
      requestAccess: 'Request access',
      requestAccessHint:
        'You are viewing catalog metadata only. Click the steward or owner name to file an access request.',
      rows: 'Rows',
      updated: 'Updated',
      sourceSystem: 'Source system',
      lastRefresh: 'Last refresh',
      physicalLocation: 'Physical location',
      cdiscDomain: 'CDISC domain',
      owner: 'Owner',
      smes: 'Subject matter experts',
      noColumns: 'No column-level metadata is captured for this',
      noColumnsSuffix: '',
    },
    status: {
      Approved: 'Approved',
      Accepted: 'Accepted',
      'Under Review': 'Under Review',
      'Submitted for Approval': 'Submitted for Approval',
      Candidate: 'Candidate',
      Obsolete: 'Obsolete',
      Rejected: 'Rejected',
    },
    classification: {
      Public: 'Public',
      Internal: 'Internal',
      Confidential: 'Confidential',
      Restricted: 'Restricted',
    },
    chips: {
      certified: 'Certified',
      gxp: 'GxP',
      phi: 'PHI',
      pii: 'PII',
    },
    search: {
      placeholder: 'Find a table, glossary term, biomarker…',
      noMatch: 'No matches for',
      navigate: 'navigate',
      open: 'open',
      close: 'close',
      results: 'results',
    },
    accessRequest: {
      title: 'Request data access',
      subtitle: 'Submit an access request to the asset steward.',
      requesterName: 'Your name',
      requesterEmail: 'Your email',
      requesterDept: 'Department / function',
      reason: 'Reason for access',
      intendedUse: 'Intended use',
      duration: 'Expected duration',
      managerEmail: 'Approving manager (email)',
      asset: 'Asset',
      steward: 'Steward',
      durationOptions: {
        '30d': '30 days',
        '90d': '90 days',
        '180d': '180 days',
        '365d': '1 year',
        ongoing: 'Ongoing',
      },
      compliance:
        'I confirm I have completed the required GxP and data protection training, and I will use this data only for the purpose stated above.',
      cancel: 'Cancel',
      submit: 'Submit request',
      submitting: 'Submitting…',
      successTitle: 'Request submitted',
      successBody:
        'The steward has been notified. You will receive a confirmation email and a tracking ID once the request is processed.',
      close: 'Close',
      validation: {
        required: 'Required field',
        email: 'Invalid email address',
        compliance: 'You must confirm the compliance statement.',
      },
    },
    footer: {
      sourcedFrom: 'Sourced from Collibra · Refreshed daily',
      internal: 'R&D Data Office · Internal use only',
    },
    settings: {
      kicker: 'Configuration',
      title: 'Settings',
      lede: 'Connection parameters, sync schedule, and content filters. Settings are stored in your browser only — values entered here are not transmitted from this page.',
      collibra: {
        title: 'Collibra connection',
        desc: 'OAuth 2.0 Client Credentials. Register an Integration-type application in Collibra (Settings → Manage OAuth applications) to obtain a Client ID and Client Secret.',
        baseUrl: 'Base URL',
        baseUrlHint: 'Your Collibra instance URL, no trailing slash.',
        clientId: 'Client ID',
        clientSecret: 'Client Secret',
        timeout: 'Request timeout',
        timeoutHint: 'Seconds.',
        test: 'Test Collibra connection',
      },
      entra: {
        title: 'Microsoft Entra ID + SharePoint',
        desc: 'Required for publishing the catalog site to a SharePoint document library. Register an app in Entra ID (Microsoft Graph: Sites.ReadWrite.All, Application permission) with admin consent.',
        tenantId: 'Tenant ID',
        clientId: 'Client ID',
        clientSecret: 'Client Secret',
        siteUrl: 'SharePoint site URL',
        siteUrlHint: 'The site collection that will host the catalog.',
        library: 'Document library',
        test: 'Test SharePoint connection',
      },
      schedule: {
        title: 'Sync schedule',
        desc: 'When the connector should pull from Collibra and refresh SharePoint. Manual runs are always available regardless of this setting.',
        frequency: 'Frequency',
        modes: { daily: 'Daily', hourly: 'Hourly', cron: 'Cron', manual: 'Manual' },
        timeOfDay: 'Time of day',
        cron: 'Cron expression',
        cronHint: 'UNIX cron format. UTC unless timezone is set.',
        timezone: 'Timezone',
        manualRun: 'Manual run',
        runNow: 'Run sync now',
      },
      filters: {
        title: 'Catalog filters',
        desc: 'Limit which Collibra domains and asset types are pulled into the published catalog. Empty domain selection means all domains are included.',
        domains: 'Domains',
        domainsHintSelected: 'selected (empty = all)',
        assetTypes: 'Asset types',
        maxAssets: 'Max assets per domain',
        gates: 'Quality gates',
        gateApproved: 'Only publish assets with status Approved',
        gateCertified: 'Only publish certified assets',
      },
      footer: {
        savedHere: 'Saved to this browser',
        unsaved: 'Unsaved changes',
        clean: 'No changes',
        reset: 'Reset',
        save: 'Save settings',
        authenticating: 'Authenticating…',
        ok: 'Connection succeeded (demo)',
        missing: 'Required fields are missing',
      },
    },
    notFound: {
      kicker: '404',
      headline: "We couldn't find that record",
      body: 'The asset or therapeutic area may have been renamed or removed from the catalog. Try the search bar above or return to the map.',
      back: 'Back to map',
    },
    views: {
      title: 'Views',
      kicker: 'Lenses on the catalog',
      lede: 'Different ways of slicing the same governed metadata. Pick the lens that matches the question you are trying to answer.',
      anatomy: { title: 'Anatomical map', desc: 'Discover data by body region and therapeutic area.' },
      pipeline: { title: 'Therapeutic pipeline', desc: '3D rail from discovery to post-marketing surveillance.' },
      timeline: { title: 'Refresh timeline', desc: 'Calendar heatmap of when data changes.' },
      lineage: { title: 'Lineage graph', desc: 'Upstream and downstream connections between assets.' },
      systems: { title: 'Source system constellation', desc: 'Each source system as a sun with its assets in orbit.' },
      quality: { title: 'Quality observatory', desc: 'Quality scores, trends, and assets needing attention.' },
      compliance: { title: 'Compliance mosaic', desc: 'Treemap of assets grouped by regulatory framework.' },
    },
    pipeline: {
      title: 'Therapeutic pipeline',
      desc: 'Assets along the drug development life-cycle. Each phase is a vertical pillar; node colour is the therapeutic area, ring size scales with rows or row equivalents.',
      assetsAtPhase: 'assets',
      drag: 'Drag to rotate',
    },
    timeline: {
      title: 'Refresh timeline',
      desc: 'Each cell is one day over the last 12 months. Darker means more assets refreshed that day. Hover for details, click to filter the asset list.',
      assets: 'asset(s) refreshed',
      none: 'No refreshes',
      mostActive: 'Most active day',
      streak: 'Longest active streak',
    },
    lineage: {
      title: 'Lineage graph',
      desc: 'Force-directed graph of how data moves between assets. Nodes are coloured by therapeutic area; edges show upstream → downstream relationships.',
      controls: 'Drag nodes · scroll to zoom · click to open',
      isolated: 'Isolated assets',
    },
    systems: {
      title: 'Source system constellation',
      desc: 'A 3D solar system. Each source system is a star, every asset orbits the system that produces it. The bigger the star, the more assets it owns.',
      drag: 'Drag to rotate · scroll to zoom',
    },
    quality: {
      title: 'Quality observatory',
      desc: 'Operational view of data trustworthiness. Quality score blends completeness, freshness, validity, and lineage coverage.',
      avgScore: 'Avg. quality',
      certifiedShare: 'Certified share',
      freshLast7: 'Fresh < 7 days',
      gxpShare: 'GxP scope',
      breakdownByDomain: 'Breakdown by therapeutic area',
      needsAttention: 'Assets that need attention',
      trend: 'Quality trend',
    },
    compliance: {
      title: 'Compliance mosaic',
      desc: 'Assets grouped by regulatory framework. Tile area is the asset count, tile colour is the average quality score for that bucket.',
      assets: 'assets',
      avgQuality: 'Avg. quality',
      noFramework: 'No regulatory framework declared',
    },
    common: {
      loading: 'Loading',
      lang: 'Language',
    },
  },
  ja: {
    appName: 'Collibra Catalog Connector',
    tagline: 'R&D データカタログ',
    nav: {
      search: 'アセット・用語を検索…',
      settings: '設定',
      toggleTheme: 'テーマ切替',
      backToMap: '人体マップへ戻る',
      backTo: '戻る:',
    },
    home: {
      kicker: '人体から探す',
      headline: '人体図から、治療領域に紐づくデータを一目で探す。',
      lede: '人体の任意の部位をクリックすると、その部位に関わる治療領域のデータが表示されます。腫瘍学やファーマコビジランスのように複数の領域に跨る場合は、関連する部位が同時に光り、線で繋がります。',
      stats: {
        therapeuticAreas: '治療領域',
        catalogued: '登録アセット',
        avgQuality: '平均品質',
        lastRefresh: '最終更新',
      },
      panels: {
        therapeuticAreas: '治療領域',
        crossSystem: '横断領域',
      },
    },
    domain: {
      domainType: 'ドメイン種別',
      community: 'コミュニティ',
      steward: 'スチュワード',
      technicalSteward: 'テクニカルスチュワード',
      anatomy: '解剖領域',
      assets: 'アセット',
      assetCount: 'アセット数',
      totalRows: '総レコード数',
      certified: '認定済み',
      sourceSystems: 'ソースシステム',
      commonTags: '主なタグ',
      avgQuality: '平均品質',
    },
    asset: {
      schema: 'スキーマ',
      qualityBreakdown: '品質内訳',
      completeness: '完全性',
      freshness: '鮮度',
      validity: '妥当性',
      lineage: '系譜カバレッジ',
      regulatoryScope: '規制範囲',
      tags: 'タグ',
      upstreamLineage: '上流データ',
      requestAccess: 'アクセス申請',
      requestAccessHint:
        'カタログのメタデータのみが表示されています。スチュワードまたはオーナー名をクリックするとアクセス申請フォームが開きます。',
      rows: 'レコード数',
      updated: '更新日時',
      sourceSystem: 'ソースシステム',
      lastRefresh: '最終更新',
      physicalLocation: '物理ロケーション',
      cdiscDomain: 'CDISC ドメイン',
      owner: 'オーナー',
      smes: 'サブジェクトマターエキスパート',
      noColumns: 'この',
      noColumnsSuffix: 'にはカラムレベルのメタデータが登録されていません。',
    },
    status: {
      Approved: '承認済',
      Accepted: '受理済',
      'Under Review': 'レビュー中',
      'Submitted for Approval': '承認申請中',
      Candidate: '候補',
      Obsolete: '廃止',
      Rejected: '却下',
    },
    classification: {
      Public: '公開',
      Internal: '社内',
      Confidential: '機密',
      Restricted: '制限',
    },
    chips: {
      certified: '認定済',
      gxp: 'GxP',
      phi: 'PHI',
      pii: 'PII',
    },
    search: {
      placeholder: 'テーブル・用語・バイオマーカーを検索…',
      noMatch: '該当なし:',
      navigate: '移動',
      open: '開く',
      close: '閉じる',
      results: '件',
    },
    accessRequest: {
      title: 'データアクセス申請',
      subtitle: 'アセットのスチュワード宛にアクセス申請を送信します。',
      requesterName: '氏名',
      requesterEmail: 'メールアドレス',
      requesterDept: '部署 / 機能',
      reason: '申請理由',
      intendedUse: '利用目的',
      duration: '利用期間',
      managerEmail: '承認上長のメールアドレス',
      asset: 'アセット',
      steward: 'スチュワード',
      durationOptions: {
        '30d': '30日間',
        '90d': '90日間',
        '180d': '180日間',
        '365d': '1年間',
        ongoing: '継続的',
      },
      compliance:
        'GxP および個人情報保護に関する必須トレーニングを受講済みであり、上記目的のみに本データを利用することを確認しました。',
      cancel: 'キャンセル',
      submit: '申請を送信',
      submitting: '送信中…',
      successTitle: '申請を受理しました',
      successBody:
        'スチュワードへ通知しました。受付完了後、確認メールとトラッキングIDをお送りします。',
      close: '閉じる',
      validation: {
        required: '必須項目です',
        email: 'メールアドレスの形式が正しくありません',
        compliance: 'コンプライアンス確認文への同意が必要です',
      },
    },
    footer: {
      sourcedFrom: 'Collibra より日次同期',
      internal: 'R&D Data Office · 社内利用のみ',
    },
    settings: {
      kicker: '設定',
      title: '設定',
      lede: '接続パラメータ、同期スケジュール、コンテンツフィルタ。設定はブラウザのローカルストレージにのみ保存され、本ページから外部送信されることはありません。',
      collibra: {
        title: 'Collibra 接続',
        desc: 'OAuth 2.0 Client Credentials 方式。Collibra の Settings → Manage OAuth applications で Type: Integration のアプリを登録し、Client ID と Client Secret を取得してください。',
        baseUrl: 'Base URL',
        baseUrlHint: 'Collibra インスタンスのURL (末尾スラッシュなし)。',
        clientId: 'Client ID',
        clientSecret: 'Client Secret',
        timeout: 'リクエストタイムアウト',
        timeoutHint: '秒',
        test: 'Collibra 接続テスト',
      },
      entra: {
        title: 'Microsoft Entra ID + SharePoint',
        desc: 'SharePoint ドキュメントライブラリへの公開に必要。Entra ID にアプリ登録し (Microsoft Graph: Sites.ReadWrite.All, Application 権限)、管理者の同意を得てください。',
        tenantId: 'Tenant ID',
        clientId: 'Client ID',
        clientSecret: 'Client Secret',
        siteUrl: 'SharePoint サイトURL',
        siteUrlHint: 'カタログをホストするサイトコレクション。',
        library: 'ドキュメントライブラリ',
        test: 'SharePoint 接続テスト',
      },
      schedule: {
        title: '同期スケジュール',
        desc: 'Collibra から取得し SharePoint を更新する頻度。手動実行は本設定に関わらずいつでも可能。',
        frequency: '頻度',
        modes: { daily: '日次', hourly: '時次', cron: 'Cron', manual: '手動のみ' },
        timeOfDay: '実行時刻',
        cron: 'Cron 式',
        cronHint: 'UNIX Cron 形式。タイムゾーン未指定時は UTC。',
        timezone: 'タイムゾーン',
        manualRun: '手動実行',
        runNow: '今すぐ同期',
      },
      filters: {
        title: 'カタログフィルタ',
        desc: '取得対象の Collibra ドメインとアセットタイプを絞り込みます。ドメイン未選択時は全ドメインが対象。',
        domains: 'ドメイン',
        domainsHintSelected: '件選択 (未選択 = 全て)',
        assetTypes: 'アセットタイプ',
        maxAssets: 'ドメインごとの最大アセット数',
        gates: '品質ゲート',
        gateApproved: 'Approved ステータスのアセットのみ公開',
        gateCertified: '認定済アセットのみ公開',
      },
      footer: {
        savedHere: 'このブラウザに保存しました',
        unsaved: '未保存の変更あり',
        clean: '変更なし',
        reset: 'リセット',
        save: '設定を保存',
        authenticating: '認証中…',
        ok: '接続成功 (デモ)',
        missing: '必須項目が未入力です',
      },
    },
    notFound: {
      kicker: '404',
      headline: '該当するレコードが見つかりません',
      body: 'アセットまたは治療領域がカタログから削除または改名された可能性があります。検索バーを使用するか、人体マップへ戻ってください。',
      back: '人体マップへ戻る',
    },
    views: {
      title: 'ビュー',
      kicker: 'カタログの見せ方',
      lede: '同じガバナンス済メタデータを、目的に応じた切り口で見られるように複数のレンズを用意しています。',
      anatomy: { title: '人体マップ', desc: '部位・治療領域から探す。' },
      pipeline: { title: '治験パイプライン', desc: '探索から市販後まで、3Dの開発フェーズに沿って配置。' },
      timeline: { title: 'リフレッシュタイムライン', desc: 'いつどれだけ更新されたかをカレンダーヒートマップで。' },
      lineage: { title: 'リネージグラフ', desc: 'アセット間の上流・下流リネージ。' },
      systems: { title: 'ソースシステム星座', desc: '各ソースシステムを恒星として、アセットを軌道で表現。' },
      quality: { title: '品質オブザーバトリ', desc: '品質スコア・トレンド・要注意アセット。' },
      compliance: { title: 'コンプライアンス・モザイク', desc: '規制フレームワーク別にアセットをトリーマップ表示。' },
    },
    pipeline: {
      title: '治験パイプライン',
      desc: '創薬ライフサイクルに沿ったアセット配置。各フェーズは縦の柱、ノード色は治療領域、リング径は規模を表す。',
      assetsAtPhase: '件',
      drag: 'ドラッグで回転',
    },
    timeline: {
      title: 'リフレッシュタイムライン',
      desc: '直近12ヶ月の1日1セル表示。色が濃いほどその日の更新数が多い。ホバーで詳細、クリックで絞り込み。',
      assets: '件のアセットが更新',
      none: '更新なし',
      mostActive: '最も活発な日',
      streak: '連続更新日数',
    },
    lineage: {
      title: 'リネージグラフ',
      desc: 'アセット間のデータフローを force-directed graph で。ノード色は治療領域、エッジは上流→下流関係を示す。',
      controls: 'ノードをドラッグ · スクロールでズーム · クリックで開く',
      isolated: '孤立アセット',
    },
    systems: {
      title: 'ソースシステム星座',
      desc: '3D太陽系。各ソースシステムが恒星、所属アセットが軌道。恒星のサイズは保有アセット数に比例。',
      drag: 'ドラッグで回転 · スクロールでズーム',
    },
    quality: {
      title: '品質オブザーバトリ',
      desc: 'データ信頼性のオペレーション視点。品質スコアは完全性 / 鮮度 / 妥当性 / 系譜カバレッジを総合。',
      avgScore: '平均品質',
      certifiedShare: '認定済率',
      freshLast7: '7日以内更新',
      gxpShare: 'GxP 対象',
      breakdownByDomain: '治療領域別ブレイクダウン',
      needsAttention: '要注意アセット',
      trend: '品質トレンド',
    },
    compliance: {
      title: 'コンプライアンス・モザイク',
      desc: '規制フレームワーク別にアセットをグループ化。タイル面積はアセット数、色はそのバケットの平均品質スコア。',
      assets: '件',
      avgQuality: '平均品質',
      noFramework: '規制フレームワーク未指定',
    },
    common: {
      loading: '読み込み中',
      lang: '言語',
    },
  },
};

type Strings = typeof STRINGS.en;

const LangContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Strings;
}>({
  lang: 'en',
  setLang: () => undefined,
  t: STRINGS.en,
});

const STORAGE_KEY = 'ccc-lang';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored === 'en' || stored === 'ja') {
      setLangState(stored);
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.language?.startsWith('ja')) {
      setLangState('ja');
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    window.localStorage.setItem(STORAGE_KEY, l);
  };

  return createElement(
    LangContext.Provider,
    { value: { lang, setLang, t: STRINGS[lang] } },
    children,
  );
}

export function useT() {
  return useContext(LangContext);
}

export function pickField<T extends Record<string, unknown>>(
  obj: T,
  field: string,
  lang: Lang,
): string {
  const jaKey = `${field}Ja` as keyof T;
  if (lang === 'ja' && typeof obj[jaKey] === 'string' && (obj[jaKey] as string).length > 0) {
    return obj[jaKey] as string;
  }
  return (obj[field as keyof T] as string) ?? '';
}
