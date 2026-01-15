type PosterUrlMap = Record<string, string>

const posterUrlMap: PosterUrlMap = {
  '/assets/poster/01-cover.png':
    'https://636c-cloudbase-9g9y5ajj044396e0-1395213680.tcb.qcloud.la/%E4%BA%BF%E5%B0%8F%E6%AD%A52025%E5%AF%92%E5%81%87%E5%88%9B%E4%B8%9A%E8%90%A5/01-cover.png',
  '/assets/poster/02-group.png':
    'https://636c-cloudbase-9g9y5ajj044396e0-1395213680.tcb.qcloud.la/%E4%BA%BF%E5%B0%8F%E6%AD%A52025%E5%AF%92%E5%81%87%E5%88%9B%E4%B8%9A%E8%90%A5/02-group.png',
  '/assets/poster/03-intro.png':
    'https://636c-cloudbase-9g9y5ajj044396e0-1395213680.tcb.qcloud.la/%E4%BA%BF%E5%B0%8F%E6%AD%A52025%E5%AF%92%E5%81%87%E5%88%9B%E4%B8%9A%E8%90%A5/03-intro.png',
  '/assets/poster/04-gains.png':
    'https://636c-cloudbase-9g9y5ajj044396e0-1395213680.tcb.qcloud.la/%E4%BA%BF%E5%B0%8F%E6%AD%A52025%E5%AF%92%E5%81%87%E5%88%9B%E4%B8%9A%E8%90%A5/04-gains.png',
  '/assets/poster/05-schedule.png':
    'https://636c-cloudbase-9g9y5ajj044396e0-1395213680.tcb.qcloud.la/%E4%BA%BF%E5%B0%8F%E6%AD%A52025%E5%AF%92%E5%81%87%E5%88%9B%E4%B8%9A%E8%90%A5/05-schedule.png',
  '/assets/poster/06-mentors.png':
    'https://636c-cloudbase-9g9y5ajj044396e0-1395213680.tcb.qcloud.la/%E4%BA%BF%E5%B0%8F%E6%AD%A52025%E5%AF%92%E5%81%87%E5%88%9B%E4%B8%9A%E8%90%A5/06-mentors.png',
  '/assets/poster/07-guard.png':
    'https://636c-cloudbase-9g9y5ajj044396e0-1395213680.tcb.qcloud.la/%E4%BA%BF%E5%B0%8F%E6%AD%A52025%E5%AF%92%E5%81%87%E5%88%9B%E4%B8%9A%E8%90%A5/07-guard.png',
  '/assets/poster/08-parents.png':
    'https://636c-cloudbase-9g9y5ajj044396e0-1395213680.tcb.qcloud.la/%E4%BA%BF%E5%B0%8F%E6%AD%A52025%E5%AF%92%E5%81%87%E5%88%9B%E4%B8%9A%E8%90%A5/08-parents.png',
  '/assets/poster/09-service.png':
    'https://636c-cloudbase-9g9y5ajj044396e0-1395213680.tcb.qcloud.la/%E4%BA%BF%E5%B0%8F%E6%AD%A52025%E5%AF%92%E5%81%87%E5%88%9B%E4%B8%9A%E8%90%A5/09-service.png',
  '/assets/poster/intro-photo.jpg':
    'https://636c-cloudbase-9g9y5ajj044396e0-1395213680.tcb.qcloud.la/%E4%BA%BF%E5%B0%8F%E6%AD%A52025%E5%AF%92%E5%81%87%E5%88%9B%E4%B8%9A%E8%90%A5/intro-photo.jpg',
  '/assets/poster/gains-photo.jpg':
    'https://636c-cloudbase-9g9y5ajj044396e0-1395213680.tcb.qcloud.la/%E4%BA%BF%E5%B0%8F%E6%AD%A52025%E5%AF%92%E5%81%87%E5%88%9B%E4%B8%9A%E8%90%A5/gains-photo.jpg',
  '/assets/poster/schedule-photo.jpg':
    'https://636c-cloudbase-9g9y5ajj044396e0-1395213680.tcb.qcloud.la/%E4%BA%BF%E5%B0%8F%E6%AD%A52025%E5%AF%92%E5%81%87%E5%88%9B%E4%B8%9A%E8%90%A5/schedule-photo.jpg',
  '/assets/poster/mentors-photo.jpg':
    'https://636c-cloudbase-9g9y5ajj044396e0-1395213680.tcb.qcloud.la/%E4%BA%BF%E5%B0%8F%E6%AD%A52025%E5%AF%92%E5%81%87%E5%88%9B%E4%B8%9A%E8%90%A5/mentors-photo.jpg',
  '/assets/poster/guard-photo.jpg':
    'https://636c-cloudbase-9g9y5ajj044396e0-1395213680.tcb.qcloud.la/%E4%BA%BF%E5%B0%8F%E6%AD%A52025%E5%AF%92%E5%81%87%E5%88%9B%E4%B8%9A%E8%90%A5/guard-photo.jpg',
  '/assets/poster/process-photo.jpg':
    'https://636c-cloudbase-9g9y5ajj044396e0-1395213680.tcb.qcloud.la/%E4%BA%BF%E5%B0%8F%E6%AD%A52025%E5%AF%92%E5%81%87%E5%88%9B%E4%B8%9A%E8%90%A5/process-photo.jpg'
}

export const getPosterFallbackUrls = () => ({
  ...posterUrlMap
})

export const loadPosterUrls = () => {
  return Promise.resolve({
    ...posterUrlMap
  })
}
