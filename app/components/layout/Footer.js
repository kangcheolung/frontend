export default function Footer() {
    return (
        <footer className="bg-indigo-900 text-indigo-100 py-8 mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="mb-4 md:mb-0">
                        <h2 className="text-2xl font-bold text-white mb-2">Stitch</h2>
                        <p className="text-indigo-200">스터디와 매치의 만남, 스티치</p>
                    </div>
                    <div className="flex space-x-6">
                        <a href="#" className="text-indigo-200 hover:text-white transition-colors duration-200">
                            서비스 소개
                        </a>
                        <a href="#" className="text-indigo-200 hover:text-white transition-colors duration-200">
                            이용약관
                        </a>
                        <a href="#" className="text-indigo-200 hover:text-white transition-colors duration-200">
                            개인정보처리방침
                        </a>
                        <a href="#" className="text-indigo-200 hover:text-white transition-colors duration-200">
                            고객센터
                        </a>
                    </div>
                </div>
                <div className="mt-8 border-t border-indigo-800 pt-6 text-center text-indigo-300">
                    <p>&copy; 2024 Stitch. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
