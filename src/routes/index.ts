import { UserRoutes } from '../app/modules/user/user.route'
import { AuthRoutes } from '../app/modules/auth/auth.route'
import express, { Router } from 'express'
import { PublicRoutes } from '../app/modules/public/public.route'
import { SupportRoutes } from '../app/modules/support/support.route'
import { UploadRoutes } from '../app/modules/upload/upload.route'
import { MessageRoutes } from '../app/modules/message/message.routes'
import { ChatRoutes } from '../app/modules/chat/chat.routes'
import { ReviewRoutes } from '../app/modules/review/review.route'
import { CalculationRoutes } from '../app/modules/calculation/calculation.route'
import { AdminRoutes } from '../app/modules/admin/admin.route'
import { StatusCodes } from 'http-status-codes'

const router = express.Router()

const apiRoutes: { path: string; route: Router }[] = [
  { path: '/user', route: UserRoutes },
  { path: '/auth', route: AuthRoutes },
  { path: '/public', route: PublicRoutes },
  { path: '/support', route: SupportRoutes },
  { path: '/upload', route: UploadRoutes },

  { path: '/message', route: MessageRoutes },
  { path: '/chat', route: ChatRoutes },
  { path: '/review', route: ReviewRoutes },
  { path: '/calculations', route: CalculationRoutes },
  { path: '/admin', route: AdminRoutes },
]

apiRoutes.forEach(route => {
  router.use(route.path, route.route)
})

router.get('/status', (req, res) => {
  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Server is running smoothly',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV,
  })
})

export default router
