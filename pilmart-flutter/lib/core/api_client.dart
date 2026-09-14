// lib/core/api_client.dart
import 'package:dio/dio.dart';
import 'secure_storage.dart';
import 'constants.dart';

class AdminCookieInterceptor extends Interceptor {
  final _storage = SecureStorageService();

  @override
  void onRequest(
      RequestOptions options, RequestInterceptorHandler handler) async {
    final cookie = await _storage.getAdminCookie();
    if (cookie != null) options.headers['Cookie'] = cookie;
    handler.next(options);
  }

  @override
  void onResponse(
      Response response, ResponseInterceptorHandler handler) async {
    final setCookieList = response.headers['set-cookie'];
    if (setCookieList != null) {
      for (final raw in setCookieList) {
        final cookiePart = raw.split(';').first.trim();
        if (cookiePart.startsWith('admin_session=')) {
          await _storage.saveAdminCookie(cookiePart);
          break;
        }
      }
    }
    handler.next(response);
  }
}

class ApiClient {
  static Dio? _dio;

  static Dio get instance {
    _dio ??= Dio(BaseOptions(baseUrl: AppConstants.nextJsBaseUrl))
      ..interceptors.add(AdminCookieInterceptor());
    return _dio!;
  }
}
